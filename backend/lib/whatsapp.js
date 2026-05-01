/**
 * WhatsApp Notification Module — Meta Cloud API
 *
 * Required env vars (add to Vercel when ready):
 *   WHATSAPP_PHONE_NUMBER_ID   — Meta Business > WhatsApp > API Setup
 *   WHATSAPP_ACCESS_TOKEN      — System user permanent token (or temp token for testing)
 *   APP_URL                    — e.g. https://fixora-repair-management-system.vercel.app
 *   SHOP_NAME                  — e.g. "ABC Mobile Repairs"
 *
 * Without WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN the function
 * logs the message to console + whatsapp_log table (stub mode).
 * Set both env vars to go live — no code change needed.
 *
 * ⚠  PRODUCTION NOTE:
 *   Free-form text messages only work if the customer messaged your
 *   WhatsApp number first within the last 24 hours.
 *   For true outbound notifications (cold send), submit template messages
 *   to Meta for approval. See TEMPLATE SETUP section at the bottom of
 *   this file for the exact template bodies to submit.
 */

const supabase = require('./supabase');

// ── Phone → E.164 (no +) ───────────────────────────────────────────
// Handles "+91 98765 43210", "98765 43210", "09876543210", etc.
function formatPhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');          // strip non-digits
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;  // bare 10-digit Indian number
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;                                    // already has country code
}

// ── Message builder ─────────────────────────────────────────────────
function buildMessage(status, jobCard) {
  const model = `${jobCard.phone_brand || ''} ${jobCard.phone_model || ''}`.trim();
  const id    = jobCard.job_card_id;
  const shop  = process.env.SHOP_NAME || 'our shop';
  const url   = process.env.APP_URL ? `${process.env.APP_URL}/track/${id}` : null;
  const track = url ? `\n\n🔗 Track your repair: ${url}` : '';

  switch (status) {
    case 'Pending':
      return (
        `Hello! Your *${model}* has been received at *${shop}*. 📱\n` +
        `Job Card: *${id}*\n` +
        `We'll keep you updated as work progresses.` +
        track
      );

    case 'In Progress':
      return (
        `🔧 Update: Our technician has started working on your *${model}*.\n` +
        `Job Card: *${id}*` +
        track
      );

    case 'Ready for Delivery': {
      const est = parseFloat(jobCard.estimated_amount) || 0;
      const adv = parseFloat(jobCard.advance_amount)   || 0;
      const bal = Math.max(0, est - adv);

      let paymentLine = '';
      if (est > 0) {
        if (bal > 0) {
          paymentLine =
            `\n\n💰 *Amount due: ₹${bal.toLocaleString('en-IN')}*\n` +
            `   (Total: ₹${est.toLocaleString('en-IN')} | Advance paid: ₹${adv.toLocaleString('en-IN')})`;
        } else {
          paymentLine = '\n\n✅ *Fully paid — no balance due.*';
        }
      }

      return (
        `🎉 Great news! Your *${model}* is repaired and ready for pickup!\n` +
        `Job Card: *${id}*` +
        paymentLine +
        `\n\nPlease visit *${shop}* at your convenience.` +
        track
      );
    }

    case 'Delivered':
      return (
        `🙏 Thank you for choosing *${shop}*!\n` +
        `Your *${model}* (Job Card: *${id}*) has been delivered. Hope to see you again!`
      );

    case 'Returned':
      return (
        `Your device *${model}* (Job Card: *${id}*) has been returned to you.\n` +
        `Please contact us if you have any concerns.`
      );

    case 'Delayed':
      return (
        `We're sorry — your *${model}* repair (Job Card: *${id}*) is taking longer than expected.\n` +
        `Our team will reach out with an update shortly.`
      );

    default:
      return null;
  }
}

// ── Main export ─────────────────────────────────────────────────────
async function sendWhatsAppNotification(jobCard, newStatus) {
  const phone   = formatPhone(jobCard.customer_phone);
  const message = buildMessage(newStatus, jobCard);

  if (!phone) {
    console.log(`[WhatsApp] Skipped — no phone for ${jobCard.job_card_id}`);
    await log(jobCard.job_card_id, null, message, 'skipped', 'No phone number');
    return;
  }

  if (!message) {
    // No template defined for this status — silent skip
    return;
  }

  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const ACCESS_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN;

  // ── Stub mode (credentials not set) ────────────────────────────
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.log(`[WhatsApp STUB] → ${phone}\n${message}\n`);
    await log(jobCard.job_card_id, phone, message, 'pending', null);
    return;
  }

  // ── Live send via Meta Cloud API ────────────────────────────────
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to:   phone,
          type: 'text',
          text: { body: message, preview_url: false },
        }),
      }
    );

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error?.message || JSON.stringify(result));
    }

    console.log(`[WhatsApp] ✓ Sent to ${phone} — ${jobCard.job_card_id} [${newStatus}]`);
    await log(jobCard.job_card_id, phone, message, 'sent', null);

  } catch (err) {
    console.error(`[WhatsApp] ✗ Failed for ${jobCard.job_card_id}:`, err.message);
    await log(jobCard.job_card_id, phone, message, 'failed', err.message);
  }
}

// ── Log to whatsapp_log table ───────────────────────────────────────
async function log(jobCardId, phone, message, status, error) {
  try {
    await supabase.from('whatsapp_log').insert({
      job_card_id: jobCardId,
      phone:       phone   || 'N/A',
      message:     message || '—',
      status,
      error:       error   || null,
      sent_at:     status === 'sent' ? new Date().toISOString() : null,
    });
  } catch (e) {
    console.error('[WhatsApp] Log insert failed:', e.message);
  }
}

module.exports = { sendWhatsAppNotification };

/*
 * ─────────────────────────────────────────────────────────────────────
 * TEMPLATE SETUP (for cold outbound messages without prior customer contact)
 * ─────────────────────────────────────────────────────────────────────
 * Submit these at: Meta Business Suite > WhatsApp Manager > Message Templates
 *
 * Template 1 — "repair_received"
 *   Category: UTILITY
 *   Body: Your {{1}} has been received at {{2}}. Job Card: {{3}}.
 *         We'll keep you updated as work progresses.
 *   Variables: [phone_brand + phone_model], [SHOP_NAME], [job_card_id]
 *
 * Template 2 — "repair_status_update"
 *   Category: UTILITY
 *   Body: Update on your {{1}} (Job Card: {{2}}): status is now *{{3}}*.
 *   Variables: [phone_brand + phone_model], [job_card_id], [new status]
 *
 * Template 3 — "repair_ready"
 *   Category: UTILITY
 *   Body: Great news! Your {{1}} is repaired and ready for pickup!
 *         Job Card: {{2}}. Amount due: ₹{{3}}. Please visit {{4}}.
 *   Variables: [device], [job_card_id], [balance or "0 (fully paid)"], [SHOP_NAME]
 *
 * After approval (~24 hrs), switch the API call above from type:"text"
 * to type:"template" with the appropriate component parameters.
 * ─────────────────────────────────────────────────────────────────────
 */
