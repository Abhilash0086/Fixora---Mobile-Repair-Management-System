const express = require('express');
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Invalid email or password' });

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('name, role, theme, org_id, organizations(name)')
      .eq('id', data.user.id)
      .single();

    res.json({
      token: data.session.access_token,
      user: {
        id:       data.user.id,
        email:    data.user.email,
        name:     profile?.name              || data.user.email,
        role:     profile?.role              || 'technician',
        theme:    profile?.theme             || 'dark',
        org_id:   profile?.org_id            || null,
        org_name: profile?.organizations?.name || null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/guest
router.post('/guest', async (req, res) => {
  const email    = process.env.GUEST_EMAIL;
  const password = process.env.GUEST_PASS;
  if (!email || !password) {
    return res.status(503).json({ error: 'Guest mode is not configured' });
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Guest login failed' });

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('org_id, organizations(name)')
      .eq('id', data.user.id)
      .single();

    res.json({
      token: data.session.access_token,
      user: {
        id:       data.user.id,
        email:    data.user.email,
        name:     'Guest',
        role:     'guest',
        theme:    'dark',
        org_id:   profile?.org_id            || null,
        org_name: profile?.organizations?.name || null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

// PATCH /api/auth/profile
router.patch('/profile', authenticate, async (req, res) => {
  const allowed = ['theme'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', req.user.id);
    if (error) throw error;
    res.json({ ...req.user, ...updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
