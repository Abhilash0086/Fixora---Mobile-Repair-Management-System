const supabase = require('../lib/supabase');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    console.log('[Auth] 401 — missing token', req.path);
    return res.status(401).json({ error: 'Missing token' });
  }
  const token = header.slice(7);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.log('[Auth] 401 — invalid token', req.path, error?.message);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // ── Guest shortcut ──────────────────────────────────────────────
    if (process.env.GUEST_EMAIL && user.email === process.env.GUEST_EMAIL) {
      const orgId = process.env.GUEST_ORG_ID;
      if (!orgId) {
        console.log('[Auth] 401 — guest not configured', req.path);
        return res.status(401).json({ error: 'Guest not configured' });
      }

      const { data: orgRows } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .limit(1);

      req.user = {
        id:       user.id,
        email:    user.email,
        name:     'Guest',
        role:     'guest',
        theme:    'dark',
        org_id:   orgId,
        org_name: orgRows?.[0]?.name || null,
      };
      return next();
    }

    // ── Normal users ────────────────────────────────────────────────
    const { data: rows, error: profileErr } = await supabase
      .from('user_profiles')
      .select('name, role, theme, org_id')
      .eq('id', user.id)
      .limit(1);

    const profile = rows?.[0] ?? null;

    console.log('[Auth]', req.path, '| user:', user.id, '| profileErr:', profileErr?.message, '| profile:', JSON.stringify(profile));

    if (profileErr || !profile) {
      console.log('[Auth] 401 — profile not found', req.path, profileErr?.message);
      return res.status(401).json({ error: 'Profile not found' });
    }
    if (!profile.org_id) {
      console.log('[Auth] 401 — no org_id', req.path);
      return res.status(401).json({ error: 'Account not linked to an organisation. Please contact your administrator.' });
    }

    const { data: orgRows } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.org_id)
      .limit(1);
    const org = orgRows?.[0] ?? null;

    req.user = {
      id:       user.id,
      email:    user.email,
      name:     profile.name  || user.email,
      role:     profile.role  || 'technician',
      theme:    profile.theme || 'dark',
      org_id:   profile.org_id,
      org_name: org?.name     || null,
    };
    next();
  } catch (err) {
    console.error('[Auth] 401 — exception', req.path, err.message);
    res.status(401).json({ error: 'Auth failed' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin' && req.user?.role !== 'owner') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function blockGuest(req, res, next) {
  if (req.user?.role === 'guest') {
    return res.status(403).json({ error: 'Read-only access. Please sign in for full access.' });
  }
  next();
}

module.exports = { authenticate, requireAdmin, blockGuest };
