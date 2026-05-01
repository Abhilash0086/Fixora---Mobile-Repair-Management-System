/**
 * WhatsApp Notification Module — supports Meta Cloud API OR Twilio Sandbox/Production
 *
 * Provider is selected automatically based on which env vars are present:
 *
 *   Twilio (sandbox or production):
 *     TWILIO_ACCOUNT_SID      — Twilio Console → Dashboard
 *     TWILIO_AUTH_TOKEN       — Twilio Console → Dashboard
 *     TWILIO_WHATSAPP_FROM    — e.g. "+14155238886" (sandbox) or your dedicated number
 *
 *   Meta Cloud API (production):
 *     WHATSAPP_PHONE_NUMBER_ID — Meta Business > WhatsApp > API Setup
 *     WHATSAPP_ACCESS_TOKEN    — System user permanent token
 *
 *   Stub mode (no credentials set):
 *     Logs to console + whatsapp_log table only. No real message sent.
 *
 * Other env vars:
 *   APP_URL   — e.g. https://fixora-repair-management-system.vercel.app
 *   SHOP_NAME — e.g. "ABC Mobile Repairs"
 *
 * ⚠  PRODUCTION NOTE (Meta):
 *   Free-form text messages only work if the customer messaged your
 *   WhatsApp number first within the last 24 hours.
 *   For true outbound cold sends, submit template messages to Meta for
 *   approval. See TEMPLATE SETUP section at the bottom of this file.
 *
 * ⚠  TWILIO SANDBOX NOTE:
 *   Recipients must first send "join <word>" to your sandbox number before
 *   they can receive messages. Sandbox is for testing only.
 *   For production, use a dedicated Twilio number (no opt-in required).
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

// ── Twilio send ──────────────────────────────────────────────────────
async function sendViaTwilio(phone, message, jobCardId, newStatus) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromRaw    = process.env.TWILIO_WHATSAPP_FROM || '';
  const from       = fromRaw.startsWith('whatsapp:') ? fromRaw : `whatsapp:+${fromRaw.replace(/\D/g, '')}`;
  const to         = `whatsapp:+${phone}`;

  const body = new URLSearchParams({
    From: from,
    To:   to,
    Body: message,
  });

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
        body: body.toString(),
      }
    );

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || JSON.stringify(result));
    }

    console.log(`[WhatsApp/Twilio] ✓ Sent to ${phone} — ${jobCardId} [${newStatus}]`);
    await log(jobCardId, phone, message, 'sent', null);

  } catch (err) {
    console.error(`[WhatsApp/Twilio] ✗ Failed for ${jobCardId}:`, err.message);
    await log(jobCardId, phone, message, 'failed', err.message);
  }
}

// ── Meta Cloud API send ──────────────────────────────────────────────
async function sendViaMeta(phone, message, jobCardId, newStatus) {
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const ACCESS_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN;

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

    console.log(`[WhatsApp/Meta] ✓ Sent to ${phone} — ${jobCardId} [${newStatus}]`);
    await log(jobCardId, phone, message, 'sent', null);

  } catch (err) {
    console.error(`[WhatsApp/Meta] ✗ Failed for ${jobCardId}:`, err.message);
    await log(jobCardId, phone, message, 'failed', err.message);
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

  const hasTwilio = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM;
  const hasMeta   = process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN;

  console.log(`[WhatsApp] SID=${!!process.env.TWILIO_ACCOUNT_SID} TOKEN=${!!process.env.TWILIO_AUTH_TOKEN} FROM=${!!process.env.TWILIO_WHATSAPP_FROM}`);

  if (hasTwilio) {
    return sendViaTwilio(phone, message, jobCard.job_card_id, newStatus);
  }

  if (hasMeta) {
    return sendViaMeta(phone, message, jobCard.job_card_id, newStatus);
  }

  // ── Stub mode (no credentials) ──────────────────────────────────
  console.log(`[WhatsApp STUB] → ${phone}\n${message}\n`);
  await log(jobCard.job_card_id, phone, message, 'pending', null);
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
 * TEMPLATE SETUP (for Meta cold outbound messages without prior customer contact)
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
