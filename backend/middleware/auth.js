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

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('name, role, theme')
      .eq('id', user.id)
      .single();

    req.user = {
      id:    user.id,
      email: user.email,
      name:  profile?.name  || user.email,
      role:  profile?.role  || 'technician',
      theme: profile?.theme || 'dark',
    };
    next();
  } catch {
    res.status(401).json({ error: 'Auth failed' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
