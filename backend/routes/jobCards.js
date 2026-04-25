const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const supabase = require('../lib/supabase');
const { sendWhatsAppNotification } = require('../lib/whatsapp');
const { sendStatusEmail }         = require('../lib/email');
const { authenticate, blockGuest } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Validation failed', details: errors.array() });
    return true;
  }
  return false;
}

// ──────────────────────────────────────────────
// GET /api/job-cards/dashboard
// ──────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const isTech = req.user.role === 'technician';
    let allQ = supabase.from('job_cards').select('status, created_at');
    if (isTech) allQ = allQ.eq('technician', req.user.name);
    const { data: all, error } = await allQ;
    if (error) throw error;

    const today = new Date().toISOString().slice(0, 10);

    const summary = {
      total: all.length,
      pending: 0,
      in_progress: 0,
      ready_for_delivery: 0,
      delivered: 0,
      returned: 0,
      delayed: 0,
    };

    for (const j of all) {
      if (j.status === 'Pending')              summary.pending++;
      if (j.status === 'In Progress')          summary.in_progress++;
      if (j.status === 'Ready for Delivery')   summary.ready_for_delivery++;
      if (j.status === 'Delivered')            summary.delivered++;
      if (j.status === 'Returned')             summary.returned++;
      if (j.status === 'Delayed')              summary.delayed++;
    }

    let todayQ = supabase.from('job_cards').select('*')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lte('created_at', `${today}T23:59:59.999Z`)
      .order('created_at', { ascending: false });
    if (isTech) todayQ = todayQ.eq('technician', req.user.name);
    const { data: todayCards, error: todayErr } = await todayQ;

    if (todayErr) throw todayErr;

    res.json({ summary, today_enquiries: todayCards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/job-cards
// ──────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, date, technician, search, brand } = req.query;

    let q = supabase.from('job_cards').select('*');

    if (req.user.role === 'technician') q = q.eq('technician', req.user.name);
    if (status)     q = q.eq('status', status);
    if (technician && req.user.role === 'admin') q = q.ilike('technician', `%${technician}%`);
    if (brand)      q = q.eq('phone_brand', brand);
    if (date)       q = q.gte('created_at', `${date}T00:00:00.000Z`).lte('created_at', `${date}T23:59:59.999Z`);

    if (search) {
      q = q.or(
        `job_card_id.ilike.%${search}%,phone_model.ilike.%${search}%,customer_phone.ilike.%${search}%,customer_name.ilike.%${search}%`
      );
    }

    q = q.order('created_at', { ascending: false });

    const { data, error } = await q;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/job-cards/ready
// ──────────────────────────────────────────────
router.get('/ready', async (req, res) => {
  try {
    const { search } = req.query;
    let q = supabase.from('job_cards').select('*').eq('status', 'Ready for Delivery');
    if (req.user.role === 'technician') q = q.eq('technician', req.user.name);
    if (search) {
      q = q.or(`job_card_id.ilike.%${search}%,phone_model.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    }
    q = q.order('updated_at', { ascending: false });
    const { data, error } = await q;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/job-cards/delivered
// ──────────────────────────────────────────────
router.get('/delivered', async (req, res) => {
  try {
    const { search } = req.query;
    let q = supabase.from('job_cards').select('*').eq('status', 'Delivered');
    if (req.user.role === 'technician') q = q.eq('technician', req.user.name);
    if (search) {
      q = q.or(`job_card_id.ilike.%${search}%,phone_model.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    }
    q = q.order('delivered_at', { ascending: false });
    const { data, error } = await q;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/job-cards/:id
// ──────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('job_cards')
      .select('*')
      .eq('job_card_id', req.params.id)
      .single();
    if (error) return res.status(404).json({ error: 'Job card not found' });

    const [{ data: statusLogs }, { data: editLogs }] = await Promise.all([
      supabase.from('job_card_status_log').select('*').eq('job_card_id', req.params.id).order('changed_at', { ascending: false }),
      supabase.from('job_card_edit_log').select('*').eq('job_card_id', req.params.id).order('changed_at', { ascending: false }),
    ]);

    const activity_log = [
      ...(statusLogs || []).map(l => ({ ...l, type: 'status' })),
      ...(editLogs   || []).map(l => ({ ...l, type: 'edit'   })),
    ].sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));

    res.json({ ...data, activity_log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/job-cards
// ──────────────────────────────────────────────
router.post('/',
  blockGuest,
  body('customer_name').notEmpty().trim(),
  body('phone_brand').notEmpty().trim(),
  body('phone_model').notEmpty().trim(),
  body('reported_issue').notEmpty().trim(),
  body('customer_email').optional().isEmail().normalizeEmail(),
  body('customer_phone').optional().trim(),
  body('alt_mobile_no').optional().trim(),
  body('address').optional().trim(),
  body('salutation').optional().trim(),
  body('color').optional().trim(),
  body('pattern_password').optional().trim(),
  body('imei_status').optional().trim(),
  body('power_status').optional().trim(),
  body('touch_status').optional().trim(),
  body('display_status').optional().trim(),
  body('device_condition').optional().trim(),
  body('data_backup').optional().trim(),
  body('estimated_amount').optional().isFloat({ min: 0 }),
  body('advance_amount').optional().isFloat({ min: 0 }),
  body('confirm_estimated').optional().isBoolean(),
  body('prepared_by').optional().trim(),
  body('technician').optional().trim(),
  body('eta').optional().isISO8601(),
  body('remarks').optional().trim(),
  body('status').optional().isIn(['Pending', 'In Progress', 'Ready for Delivery', 'Delivered', 'Returned', 'Delayed', 'Cancelled']),
  async (req, res) => {
    if (handleValidation(req, res)) return;
    try {
      // Generate next job card ID via DB function
      const { data: idData, error: idErr } = await supabase.rpc('next_job_card_id');
      if (idErr) throw idErr;

      const b = req.body;
      const { data, error } = await supabase
        .from('job_cards')
        .insert({
          job_card_id:       idData,
          salutation:        b.salutation        || null,
          customer_name:     b.customer_name,
          customer_email:    b.customer_email    || null,
          customer_phone:    b.customer_phone    || null,
          alt_mobile_no:     b.alt_mobile_no     || null,
          address:           b.address           || null,
          phone_brand:       b.phone_brand,
          phone_model:       b.phone_model,
          color:             b.color             || null,
          pattern_password:  b.pattern_password  || null,
          imei_status:       b.imei_status       || null,
          power_status:      b.power_status      || null,
          touch_status:      b.touch_status      || null,
          display_status:    b.display_status    || null,
          device_condition:  b.device_condition  || null,
          reported_issue:    b.reported_issue,
          remarks:           b.remarks           || null,
          data_backup:       b.data_backup       || null,
          estimated_amount:  b.estimated_amount  ? parseFloat(b.estimated_amount)  : null,
          advance_amount:    b.advance_amount    ? parseFloat(b.advance_amount)    : null,
          confirm_estimated: b.confirm_estimated ?? false,
          prepared_by:       b.prepared_by       || null,
          technician:        b.technician        || null,
          eta:               b.eta               || null,
          status:            b.status            || 'Pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Log initial status
      await supabase.from('job_card_status_log').insert({
        job_card_id: data.job_card_id,
        old_status: null,
        new_status: 'Pending',
        notes: 'Job card created',
      });

      // WhatsApp stub notification
      await sendWhatsAppNotification(data, 'Pending');

      // Email notification on creation
      await sendStatusEmail(data, 'Pending');

      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ──────────────────────────────────────────────
// PATCH /api/job-cards/:id
// ──────────────────────────────────────────────
router.patch('/:id',
  blockGuest,
  body('status').optional().isIn(['Pending', 'In Progress', 'Ready for Delivery', 'Delivered', 'Returned', 'Delayed', 'Cancelled']),
  body('technician').optional().trim(),
  body('eta').optional().isISO8601(),
  body('remarks').optional().trim(),
  async (req, res) => {
    if (handleValidation(req, res)) return;
    try {
      // Fetch current state
      const { data: existing, error: fetchErr } = await supabase
        .from('job_cards')
        .select('*')
        .eq('job_card_id', req.params.id)
        .single();
      if (fetchErr) return res.status(404).json({ error: 'Job card not found' });

      const updates = {};
      const allowed = req.user.role === 'technician'
        ? ['status']
        : [
            'status', 'technician', 'eta', 'remarks',
            'salutation', 'customer_name', 'customer_email', 'customer_phone', 'alt_mobile_no', 'address',
            'phone_brand', 'phone_model', 'color', 'pattern_password', 'imei_status',
            'power_status', 'touch_status', 'display_status', 'device_condition',
            'reported_issue', 'data_backup',
            'estimated_amount', 'advance_amount', 'confirm_estimated', 'prepared_by',
          ];
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }

      if (updates.status === 'Delivered' && existing.status !== 'Delivered') {
        updates.delivered_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('job_cards')
        .update(updates)
        .eq('job_card_id', req.params.id)
        .select()
        .single();
      if (error) throw error;

      // Log status change
      if (updates.status && updates.status !== existing.status) {
        await supabase.from('job_card_status_log').insert({
          job_card_id: req.params.id,
          old_status: existing.status,
          new_status: updates.status,
        });
        await sendWhatsAppNotification(data, updates.status);
        await sendStatusEmail(data, updates.status);
      }

      // Log field changes
      const TRACKED_FIELDS = [
        'salutation', 'customer_name', 'customer_email', 'customer_phone', 'alt_mobile_no', 'address',
        'phone_brand', 'phone_model', 'color', 'pattern_password', 'imei_status',
        'power_status', 'touch_status', 'display_status', 'device_condition',
        'reported_issue', 'remarks', 'data_backup',
        'estimated_amount', 'advance_amount', 'confirm_estimated',
        'prepared_by', 'technician', 'eta',
      ];
      const editLogs = [];
      for (const field of TRACKED_FIELDS) {
        if (updates[field] === undefined) continue;
        const oldVal = existing[field] ?? null;
        const newVal = updates[field] ?? null;
        if (String(oldVal) !== String(newVal)) {
          editLogs.push({
            job_card_id: req.params.id,
            field_name:  field,
            old_value:   oldVal !== null ? String(oldVal) : null,
            new_value:   newVal !== null ? String(newVal) : null,
          });
        }
      }
      if (editLogs.length > 0) {
        await supabase.from('job_card_edit_log').insert(editLogs);
      }

      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
