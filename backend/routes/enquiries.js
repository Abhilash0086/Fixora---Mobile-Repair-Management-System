const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../lib/supabase');
const { authenticate, blockGuest } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ──────────────────────────────────────────────
// GET /api/enquiries          — all
// GET /api/enquiries?today=true — today only
// ──────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    let q = supabase.from('enquiries').select('*').eq('org_id', req.user.org_id).order('created_at', { ascending: false });

    // date range: ?from=YYYY-MM-DD&to=YYYY-MM-DD
    if (req.query.from) q = q.gte('created_at', `${req.query.from}T00:00:00.000Z`);
    if (req.query.to)   q = q.lte('created_at', `${req.query.to}T23:59:59.999Z`);

    // legacy: ?today=true (kept for backward compat)
    if (req.query.today === 'true' && !req.query.from && !req.query.to) {
      const today = new Date().toISOString().slice(0, 10);
      q = q.gte('created_at', `${today}T00:00:00.000Z`).lte('created_at', `${today}T23:59:59.999Z`);
    }

    const { data, error } = await q;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/enquiries
// ──────────────────────────────────────────────
router.post('/',
  blockGuest,
  body('name').notEmpty().trim(),
  body('contact_no').optional().trim(),
  body('device').optional().trim(),
  body('description').optional().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    try {
      const { name, contact_no, device, description } = req.body;
      const { data, error } = await supabase
        .from('enquiries')
        .insert({
          name,
          org_id:      req.user.org_id,
          contact_no:  contact_no  || null,
          device:      device      || null,
          description: description || null,
        })
        .select()
        .single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ──────────────────────────────────────────────
// DELETE /api/enquiries/:id
// ──────────────────────────────────────────────
router.delete('/:id', blockGuest, async (req, res) => {
  try {
    const { error } = await supabase
      .from('enquiries')
      .delete()
      .eq('id', req.params.id)
      .eq('org_id', req.user.org_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
