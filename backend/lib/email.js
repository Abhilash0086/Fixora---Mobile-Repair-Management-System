const nodemailer = require('nodemailer');

// ── Transporter (lazy-init so missing config doesn't crash startup) ──
let _transporter = null;
function getTransporter() {
  if (_transporter) return _transporter;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return _transporter;
}

// ── Status messages ────────────────────────────────────────────────
const STATUS_INFO = {
  'Pending':            { msg: "We've received your device and it's in our queue. We'll get started soon.",          color: '#a16207' },
  'In Progress':        { msg: 'Our technician has started working on your device.',                                  color: '#1d4ed8' },
  'Ready for Delivery': { msg: 'Great news! Your device is repaired and ready for pickup. Please visit us soon.',    color: '#15803d' },
  'Delivered':          { msg: 'Your device has been delivered. Thank you for choosing us!',                         color: '#6d28d9' },
  'Delayed':            { msg: 'We regret that your repair is taking longer than expected. We\'ll update you soon.', color: '#c2410c' },
  'Returned':           { msg: 'Your device has been returned to you.',                                              color: '#dc2626' },
  'Cancelled':          { msg: 'Your repair job has been cancelled. Please contact us if you have any questions.',   color: '#4b5563' },
};

// ── HTML email template ────────────────────────────────────────────
function buildEmail(jobCard, newStatus) {
  const shop   = process.env.SHOP_NAME || 'Fixora Repairs';
  const info   = STATUS_INFO[newStatus] || { msg: `Your repair status has been updated to ${newStatus}.`, color: '#f97316' };
  const device = `${jobCard.phone_brand || ''} ${jobCard.phone_model || ''}`.trim() || 'Your device';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#18181b;padding:24px 32px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${shop}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#a1a1aa;">Repair Status Notification</p>
          </td>
        </tr>

        <!-- Status badge -->
        <tr>
          <td style="padding:28px 32px 0;">
            <p style="margin:0 0 6px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Current Status</p>
            <span style="display:inline-block;background:${info.color}18;color:${info.color};border:1px solid ${info.color}44;
              padding:6px 16px;border-radius:999px;font-size:14px;font-weight:600;">
              ${newStatus}
            </span>
          </td>
        </tr>

        <!-- Message -->
        <tr>
          <td style="padding:20px 32px;">
            <p style="margin:0;font-size:15px;color:#27272a;line-height:1.6;">${info.msg}</p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e4e4e7;margin:0;"></td></tr>

        <!-- Job details -->
        <tr>
          <td style="padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:5px 0;font-size:12px;color:#71717a;width:140px;">Job Card ID</td>
                <td style="padding:5px 0;font-size:13px;color:#18181b;font-weight:600;font-family:monospace;">${jobCard.job_card_id}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;font-size:12px;color:#71717a;">Device</td>
                <td style="padding:5px 0;font-size:13px;color:#18181b;">${device}</td>
              </tr>
              ${jobCard.reported_issue ? `<tr>
                <td style="padding:5px 0;font-size:12px;color:#71717a;vertical-align:top;">Issue</td>
                <td style="padding:5px 0;font-size:13px;color:#18181b;">${jobCard.reported_issue}</td>
              </tr>` : ''}
              ${jobCard.remarks ? `<tr>
                <td style="padding:5px 0;font-size:12px;color:#71717a;vertical-align:top;">Remarks</td>
                <td style="padding:5px 0;font-size:13px;color:#18181b;">${jobCard.remarks}</td>
              </tr>` : ''}
              ${jobCard.eta ? `<tr>
                <td style="padding:5px 0;font-size:12px;color:#71717a;">Expected By</td>
                <td style="padding:5px 0;font-size:13px;color:#18181b;">${new Date(jobCard.eta).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</td>
              </tr>` : ''}
            </table>
          </td>
        </tr>

        <!-- Track link -->
        <tr>
          <td style="padding:0 32px 28px;">
            <a href="${process.env.APP_URL || ''}/track/${jobCard.job_card_id}"
              style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;
                padding:10px 22px;border-radius:8px;font-size:13px;font-weight:600;">
              Track Your Repair →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f4f4f5;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#a1a1aa;">
              This is an automated message from ${shop}. Please do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Main export ────────────────────────────────────────────────────
async function sendStatusEmail(jobCard, newStatus) {
  if (!jobCard.customer_email) return;
  const transporter = getTransporter();
  if (!transporter) return; // SMTP not configured — skip silently

  const shop = process.env.SHOP_NAME || 'Fixora Repairs';

  try {
    await transporter.sendMail({
      from:    `"${shop}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to:      jobCard.customer_email,
      subject: `Repair Update: ${newStatus} — ${jobCard.job_card_id}`,
      html:    buildEmail(jobCard, newStatus),
    });
    console.log(`Email sent to ${jobCard.customer_email} for ${jobCard.job_card_id} [${newStatus}]`);
  } catch (err) {
    // Non-fatal — log but don't fail the API request
    console.error(`Email failed for ${jobCard.job_card_id}:`, err.message);
  }
}

module.exports = { sendStatusEmail };
