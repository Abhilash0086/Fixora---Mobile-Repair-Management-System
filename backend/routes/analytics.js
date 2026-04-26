const express = require('express');
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
// Allow owner, admin and guest; block technician
router.use((req, res, next) => {
  if (!['owner', 'admin', 'guest'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
});

// ──────────────────────────────────────────────
// GET /api/analytics/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD
// ──────────────────────────────────────────────
router.get('/revenue', async (req, res) => {
  try {
    const { from, to } = req.query;

    let q = supabase
      .from('job_cards')
      .select('status, estimated_amount, advance_amount, created_at, delivered_at');

    if (from) q = q.gte('created_at', `${from}T00:00:00.000Z`);
    if (to)   q = q.lte('created_at', `${to}T23:59:59.999Z`);

    const { data, error } = await q;
    if (error) throw error;

    let total_estimated = 0;
    let total_advance   = 0;
    let delivered_count = 0;
    const monthMap = {};

    for (const j of data) {
      const est = parseFloat(j.estimated_amount) || 0;
      const adv = parseFloat(j.advance_amount)   || 0;
      total_estimated += est;
      total_advance   += adv;
      if (j.status === 'Delivered') delivered_count++;

      const month = j.created_at.slice(0, 7); // "YYYY-MM"
      if (!monthMap[month]) {
        monthMap[month] = { month, jobs: 0, delivered: 0, estimated: 0, advance: 0 };
      }
      monthMap[month].jobs++;
      monthMap[month].estimated += est;
      monthMap[month].advance   += adv;
      if (j.status === 'Delivered') monthMap[month].delivered++;
    }

    const monthly = Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      summary: {
        total_jobs:         data.length,
        delivered_jobs:     delivered_count,
        total_estimated:    Math.round(total_estimated),
        total_advance:      Math.round(total_advance),
        pending_collection: Math.round(total_estimated - total_advance),
        avg_repair_value:   data.length ? Math.round(total_estimated / data.length) : 0,
      },
      monthly,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/analytics/technicians?from=YYYY-MM-DD&to=YYYY-MM-DD
// ──────────────────────────────────────────────
router.get('/technicians', async (req, res) => {
  try {
    const { from, to } = req.query;

    let q = supabase
      .from('job_cards')
      .select('technician, status, estimated_amount, created_at, delivered_at');

    if (from) q = q.gte('created_at', `${from}T00:00:00.000Z`);
    if (to)   q = q.lte('created_at', `${to}T23:59:59.999Z`);

    const { data, error } = await q;
    if (error) throw error;

    const techMap = {};

    for (const j of data) {
      const name = j.technician || 'Unassigned';
      if (!techMap[name]) {
        techMap[name] = {
          name,
          total: 0,
          delivered: 0,
          in_progress: 0,
          pending: 0,
          delayed: 0,
          returned: 0,
          ready_for_delivery: 0,
          total_estimated: 0,
          turnaround_ms: [],
        };
      }
      const t = techMap[name];
      t.total++;
      t.total_estimated += parseFloat(j.estimated_amount) || 0;

      switch (j.status) {
        case 'Delivered':
          t.delivered++;
          if (j.delivered_at && j.created_at) {
            t.turnaround_ms.push(new Date(j.delivered_at) - new Date(j.created_at));
          }
          break;
        case 'In Progress':         t.in_progress++;         break;
        case 'Pending':             t.pending++;             break;
        case 'Delayed':             t.delayed++;             break;
        case 'Returned':            t.returned++;            break;
        case 'Ready for Delivery':  t.ready_for_delivery++;  break;
      }
    }

    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const result = Object.values(techMap)
      .map(t => ({
        name:               t.name,
        total:              t.total,
        delivered:          t.delivered,
        in_progress:        t.in_progress,
        pending:            t.pending,
        ready_for_delivery: t.ready_for_delivery,
        delayed:            t.delayed,
        returned:           t.returned,
        total_estimated:    Math.round(t.total_estimated),
        avg_turnaround_days: t.turnaround_ms.length
          ? Math.round(
              (t.turnaround_ms.reduce((a, b) => a + b, 0) / t.turnaround_ms.length / MS_PER_DAY) * 10
            ) / 10
          : null,
        completion_rate: t.total ? Math.round((t.delivered / t.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
