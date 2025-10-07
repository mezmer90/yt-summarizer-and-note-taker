// Email Configuration - Nodemailer
let nodemailer;
let transporter = null;

try {
  nodemailer = require('nodemailer');

  // Debug logging
  console.log('Nodemailer loaded. Type:', typeof nodemailer);
  console.log('Has createTransporter?', typeof nodemailer.createTransporter);

  // Handle ES6 default export
  if (!nodemailer.createTransporter && nodemailer.default) {
    nodemailer = nodemailer.default;
    console.log('Using nodemailer.default');
  }

  if (typeof nodemailer.createTransporter !== 'function') {
    throw new Error('nodemailer.createTransporter is not a function');
  }
} catch (error) {
  console.error('❌ Nodemailer loading error:', error);
  console.error('⚠️ Email service will be disabled. Server will continue to run.');
  console.error('To fix: npm install nodemailer@6.9.7');

  // Don't exit - let server start without email
  module.exports = {
    verify: (callback) => callback(new Error('Email service not available'), false),
    sendMail: async () => ({ success: false, error: 'Email service not configured' })
  };
  return;
}

// Initialize email transporter based on service
if (process.env.EMAIL_SERVICE === 'gmail') {
  // Gmail configuration
  transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
} else if (process.env.EMAIL_SERVICE === 'sendgrid') {
  // SendGrid configuration
  transporter = nodemailer.createTransporter({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY
    }
  });
} else {
  // Default SMTP configuration
  transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

// Verify email configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service configuration error:', error);
  } else {
    console.log('✅ Email service ready to send messages');
  }
});

module.exports = transporter;
