/**
 * WhatsApp Notification Module
 * Stage 1: Stub only — logs intent, does not send.
 * Stage 2: Uncomment the fetch block and fill in Meta Cloud API credentials.
 */

const supabase = require('./supabase');

const STATUS_MESSAGES = {
  'Pending':              'Your device ({model}) has been received at Fixora. Job Card: {id}. We will update you once diagnosis begins.',
  'In Progress':          'Good news! Our technician has started working on your {model}. Job Card: {id}.',
  'Ready for Delivery':   'Your {model} is repaired and ready for pickup! Job Card: {id}. Please visit us at your convenience.',
  'Delivered':            'Thank you for choosing Fixora! Your {model} (Job Card: {id}) has been delivered. Hope to see you again!',
  'Returned':             'Your device {model} (Job Card: {id}) has been returned. Please contact us if you have any concerns.',
  'Delayed':              'We regret to inform you that your {model} repair (Job Card: {id}) is delayed. Our team will reach out shortly.',
};

function buildMessage(status, jobCard) {
  const template = STATUS_MESSAGES[status];
  if (!template) return null;
  return template
    .replace('{model}', `${jobCard.phone_brand} ${jobCard.phone_model}`)
    .replace('{id}', jobCard.job_card_id);
}

async function sendWhatsAppNotification(jobCard, newStatus) {
  const phone = jobCard.customer_phone;
  const message = buildMessage(newStatus, jobCard);

  if (!phone) {
    console.log(`[WhatsApp] Skipped - no phone number for job card ${jobCard.job_card_id}`);
    await logNotification(jobCard.job_card_id, phone, message, 'skipped', null);
    return;
  }

  if (!message) {
    console.log(`[WhatsApp] No template for status "${newStatus}", skipping.`);
    return;
  }

  console.log(`[WhatsApp STUB] Would send to ${phone}: "${message}"`);

  // ─────────────────────────────────────────────────────────────────
  // STAGE 2: Uncomment this block when WhatsApp credentials are ready
  // ─────────────────────────────────────────────────────────────────
  // const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  // const ACCESS_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN;
  //
  // try {
  //   const res = await fetch(
  //     `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
  //     {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         Authorization: `Bearer ${ACCESS_TOKEN}`,
  //       },
  //       body: JSON.stringify({
  //         messaging_product: 'whatsapp',
  //         to: phone,
  //         type: 'text',
  //         text: { body: message },
  //       }),
  //     }
  //   );
  //   if (!res.ok) throw new Error(await res.text());
  //   await logNotification(jobCard.job_card_id, phone, message, 'sent', null);
  // } catch (err) {
  //   console.error('[WhatsApp] Send failed:', err.message);
  //   await logNotification(jobCard.job_card_id, phone, message, 'failed', err.message);
  // }
  // ─────────────────────────────────────────────────────────────────

  await logNotification(jobCard.job_card_id, phone, message, 'pending', null);
}

async function logNotification(jobCardId, phone, message, status, error) {
  try {
    await supabase.from('whatsapp_log').insert({
      job_card_id: jobCardId,
      phone: phone || 'N/A',
      message: message || 'No template',
      status,
      error,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    });
  } catch (e) {
    console.error('[WhatsApp] Log insert failed:', e.message);
  }
}

module.exports = { sendWhatsAppNotification };
