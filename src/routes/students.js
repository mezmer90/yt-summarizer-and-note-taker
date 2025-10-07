const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAdmin } = require('../middleware/auth');

// Submit student verification request
router.post('/verify', async (req, res) => {
  try {
    const { extension_user_id, email, university_name, graduation_year, student_id_url } = req.body;

    if (!extension_user_id || !email) {
      return res.status(400).json({
        success: false,
        message: 'Extension user ID and email are required'
      });
    }

    // Check if user already has a pending or approved request
    const existingRequest = await pool.query(
      'SELECT * FROM student_verifications WHERE extension_user_id = $1 AND status IN ($2, $3)',
      [extension_user_id, 'pending', 'approved']
    );

    if (existingRequest.rows.length > 0) {
      const status = existingRequest.rows[0].status;
      return res.status(400).json({
        success: false,
        message: status === 'approved'
          ? 'You already have an approved student verification'
          : 'You already have a pending verification request'
      });
    }

    // Insert new verification request
    const result = await pool.query(
      `INSERT INTO student_verifications
       (extension_user_id, email, university_name, graduation_year, student_id_url, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [extension_user_id, email, university_name, graduation_year, student_id_url, 'pending']
    );

    res.json({
      success: true,
      message: 'Student verification request submitted. Admin will review within 24 hours.',
      verification: result.rows[0]
    });

  } catch (error) {
    console.error('Error submitting student verification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit verification request'
    });
  }
});

// Check verification status
router.get('/status/:extension_user_id', async (req, res) => {
  try {
    const { extension_user_id } = req.params;

    const result = await pool.query(
      `SELECT id, status, requested_at, reviewed_at, rejection_reason, expires_at
       FROM student_verifications
       WHERE extension_user_id = $1
       ORDER BY requested_at DESC
       LIMIT 1`,
      [extension_user_id]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        verified: false,
        message: 'No verification request found'
      });
    }

    const verification = result.rows[0];
    const verified = verification.status === 'approved' &&
                    (!verification.expires_at || new Date(verification.expires_at) > new Date());

    res.json({
      success: true,
      verified,
      status: verification.status,
      requested_at: verification.requested_at,
      reviewed_at: verification.reviewed_at,
      rejection_reason: verification.rejection_reason,
      expires_at: verification.expires_at
    });

  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check verification status'
    });
  }
});

// Admin: Get all pending verifications
router.get('/admin/pending', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sv.*, u.email as user_email, u.tier, u.plan_name
       FROM student_verifications sv
       LEFT JOIN users u ON sv.extension_user_id = u.extension_user_id
       WHERE sv.status = 'pending'
       ORDER BY sv.requested_at ASC`
    );

    res.json({
      success: true,
      verifications: result.rows
    });

  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending verifications'
    });
  }
});

// Admin: Get all verifications (with filters)
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    let query = `
      SELECT sv.*, u.email as user_email, u.tier, u.plan_name
      FROM student_verifications sv
      LEFT JOIN users u ON sv.extension_user_id = u.extension_user_id
    `;

    const params = [];
    if (status) {
      query += ` WHERE sv.status = $1`;
      params.push(status);
    }

    query += ` ORDER BY sv.requested_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      verifications: result.rows
    });

  } catch (error) {
    console.error('Error fetching verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verifications'
    });
  }
});

// Admin: Approve verification
router.post('/admin/approve/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.admin.email;

    // Set expiration to 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const result = await pool.query(
      `UPDATE student_verifications
       SET status = 'approved',
           reviewed_by = $1,
           reviewed_at = NOW(),
           expires_at = $2
       WHERE id = $3
       RETURNING *`,
      [adminEmail, expiresAt, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found'
      });
    }

    // Log admin action
    await pool.query(
      `INSERT INTO admin_actions (admin_email, action, target_entity, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminEmail, 'approve_student_verification', 'student_verifications', id, JSON.stringify(result.rows[0])]
    );

    res.json({
      success: true,
      message: 'Student verification approved',
      verification: result.rows[0]
    });

  } catch (error) {
    console.error('Error approving verification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve verification'
    });
  }
});

// Admin: Reject verification
router.post('/admin/reject/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminEmail = req.admin.email;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const result = await pool.query(
      `UPDATE student_verifications
       SET status = 'rejected',
           reviewed_by = $1,
           reviewed_at = NOW(),
           rejection_reason = $2
       WHERE id = $3
       RETURNING *`,
      [adminEmail, reason, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found'
      });
    }

    // Log admin action
    await pool.query(
      `INSERT INTO admin_actions (admin_email, action, target_entity, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminEmail, 'reject_student_verification', 'student_verifications', id, JSON.stringify({ reason, ...result.rows[0] })]
    );

    res.json({
      success: true,
      message: 'Student verification rejected',
      verification: result.rows[0]
    });

  } catch (error) {
    console.error('Error rejecting verification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject verification'
    });
  }
});

module.exports = router;
