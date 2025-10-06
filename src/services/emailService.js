// Email Service
const transporter = require('../config/email');

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"${process.env.FROM_EMAIL_NAME || 'YouTube Summarizer Pro'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML if no text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Welcome email for new users
const sendWelcomeEmail = async (email, userName) => {
  const subject = 'Welcome to YouTube Summarizer Pro!';
  const html = `
    <h1>Welcome to YouTube Summarizer Pro! 🎉</h1>
    <p>Hi ${userName || 'there'},</p>
    <p>Thank you for installing YouTube Summarizer Pro. You're now ready to transform long YouTube videos into concise, actionable summaries!</p>

    <h3>What's included in your Free plan:</h3>
    <ul>
      <li>✅ All 12 processing modes</li>
      <li>✅ Videos up to 30 minutes</li>
      <li>✅ All 5 AI models (with your OpenRouter API key)</li>
      <li>✅ Basic Notion integration</li>
    </ul>

    <h3>Getting Started:</h3>
    <ol>
      <li>Get your OpenRouter API key from <a href="https://openrouter.ai/keys">openrouter.ai/keys</a></li>
      <li>Open the extension and go to Settings</li>
      <li>Paste your API key and save</li>
      <li>Start summarizing videos!</li>
    </ol>

    <p><strong>Want longer videos and premium features?</strong><br>
    Upgrade to Premium for videos up to 2 hours, or Unlimited for any length!</p>

    <p>Need help? Reply to this email or visit our support center.</p>

    <p>Happy summarizing!<br>
    The YouTube Summarizer Pro Team</p>
  `;

  return sendEmail({ to: email, subject, html });
};

// Upgrade notification email
const sendUpgradeEmail = async (email, userName, planName) => {
  const subject = `🎉 Welcome to ${planName}!`;
  const html = `
    <h1>Congratulations on upgrading! 🚀</h1>
    <p>Hi ${userName || 'there'},</p>
    <p>Your ${planName} subscription is now active!</p>

    <h3>What's new in ${planName}:</h3>
    ${planName.includes('Premium') ? `
    <ul>
      <li>✅ Videos up to 2 hours</li>
      <li>✅ Full Notion integration with smart tags</li>
      <li>✅ Unlimited history</li>
      <li>✅ Claude 3.5 Sonnet AI model</li>
    </ul>
    ` : planName.includes('Unlimited') ? `
    <ul>
      <li>✅ UNLIMITED video length</li>
      <li>✅ Batch processing</li>
      <li>✅ Priority processing</li>
      <li>✅ Claude 3 Opus AI model</li>
    </ul>
    ` : planName.includes('Managed') ? `
    <ul>
      <li>✅ No API key needed - we provide it!</li>
      <li>✅ Unlimited summaries</li>
      <li>✅ Unlimited video length</li>
      <li>✅ Priority support</li>
    </ul>
    ` : ''}

    <p>Start using your new features right away - just open the extension!</p>

    <p>Thank you for supporting YouTube Summarizer Pro!</p>

    <p>Best regards,<br>
    The YouTube Summarizer Pro Team</p>
  `;

  return sendEmail({ to: email, subject, html });
};

// Usage limit warning email
const sendUsageLimitEmail = async (email, userName, tier, limit) => {
  const subject = '⚠️ Usage Limit Warning';
  const html = `
    <h1>Usage Limit Warning</h1>
    <p>Hi ${userName || 'there'},</p>
    <p>You're approaching your daily usage limit for ${tier} tier.</p>

    <p><strong>Current usage:</strong> ${limit}% of daily limit</p>

    <p>Consider upgrading to a higher tier for unlimited usage:</p>
    <ul>
      <li>Premium - Videos up to 2 hours</li>
      <li>Unlimited - No limits at all!</li>
      <li>Managed - We provide the API, no limits</li>
    </ul>

    <p><a href="${process.env.BACKEND_URL || ''}/pricing">View Plans</a></p>

    <p>Best regards,<br>
    The YouTube Summarizer Pro Team</p>
  `;

  return sendEmail({ to: email, subject, html });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendUpgradeEmail,
  sendUsageLimitEmail
};
