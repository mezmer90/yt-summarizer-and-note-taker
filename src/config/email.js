// Email Configuration - Nodemailer
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (error) {
  console.error('❌ Nodemailer package not found. Run: npm install nodemailer');
  process.exit(1);
}

let transporter;

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
