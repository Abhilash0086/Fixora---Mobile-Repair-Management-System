/**
 * Public routes — no authentication required.
 * Only safe, read-only data is exposed here.
 */
const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

// ──────────────────────────────────────────────
// GET /api/public/track/:id
// ──────────────────────────────────────────────
router.get('/track/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('job_cards')
      .select(
        'job_card_id, customer_name, phone_brand, phone_model, color, ' +
        'reported_issue, remarks, status, eta, technician, created_at, delivered_at'
      )
      .eq('job_card_id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Job card not found' });
    }

    // Status timeline — only status changes, no field edits
    const { data: statusLogs } = await supabase
      .from('job_card_status_log')
      .select('old_status, new_status, changed_at, notes')
      .eq('job_card_id', req.params.id)
      .order('changed_at', { ascending: true });

    res.json({
      ...data,
      // Mask technician to first name only for privacy
      technician: data.technician ? data.technician.split(' ')[0] : null,
      status_timeline: statusLogs || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
