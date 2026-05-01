const supabase = require('../lib/supabase');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  const token = header.slice(7);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    // Fetch profile (no join — separate query for org name)
    const { data: profile, error: profileErr } = await supabase
      .from('user_profiles')
      .select('name, role, theme, org_id')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      return res.status(401).json({ error: 'Profile not found' });
    }
    if (!profile.org_id) {
      return res.status(401).json({ error: 'Account not linked to an organisation. Please contact your administrator.' });
    }

    // Fetch org name separately
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.org_id)
      .single();

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
    console.error('Auth error:', err.message);
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
