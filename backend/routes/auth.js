const express      = require('express');
const supabase     = require('../lib/supabase');      // DB queries only
const supabaseAuth = require('../lib/supabaseAuth');  // auth operations only
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper: fetch profile + org name as two separate queries
async function getProfileAndOrg(userId) {
  const { data: rows } = await supabase
    .from('user_profiles')
    .select('name, role, theme, org_id')
    .eq('id', userId)
    .limit(1);

  const profile = rows?.[0] ?? null;
  if (!profile) return { profile: null, orgName: null };

  const { data: orgRows } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', profile.org_id)
    .limit(1);

  return { profile, orgName: orgRows?.[0]?.name || null };
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Invalid email or password' });

    const { profile, orgName } = await getProfileAndOrg(data.user.id);

    res.json({
      token: data.session.access_token,
      user: {
        id:       data.user.id,
        email:    data.user.email,
        name:     profile?.name  || data.user.email,
        role:     profile?.role  || 'technician',
        theme:    profile?.theme || 'dark',
        org_id:   profile?.org_id || null,
        org_name: orgName,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/guest
// Uses GUEST_EMAIL, GUEST_PASS, GUEST_ORG_ID env vars.
// Does NOT query user_profiles — avoids RLS / session-caching issues.
router.post('/guest', async (req, res) => {
  const email    = process.env.GUEST_EMAIL;
  const password = process.env.GUEST_PASS;
  const orgId    = process.env.GUEST_ORG_ID;

  if (!email || !password || !orgId) {
    return res.status(503).json({ error: 'Guest mode is not configured' });
  }
  try {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Guest login failed' });

    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();

    res.json({
      token: data.session.access_token,
      user: {
        id:       data.user.id,
        email:    data.user.email,
        name:     'Guest',
        role:     'guest',
        theme:    'dark',
        org_id:   orgId,
        org_name: org?.name || null,
      },
    });
  } catch (err) {
    console.error('[guest] unexpected error:', err.message);
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
