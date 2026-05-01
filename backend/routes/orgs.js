const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

// ── Super-admin guard ─────────────────────────────────────────
// Protects all org-management endpoints.
// Pass the key in the X-Admin-Key header.
function requireSuperAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key || !process.env.SUPER_ADMIN_KEY || key !== process.env.SUPER_ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// ──────────────────────────────────────────────
// GET /api/orgs  — list all organisations
// ──────────────────────────────────────────────
router.get('/', requireSuperAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, slug, created_at')
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/orgs  — create org + first owner account
// Body: { org_name, org_slug, owner_name, owner_email, owner_password }
// ──────────────────────────────────────────────
router.post('/', requireSuperAdmin, async (req, res) => {
  const { org_name, org_slug, owner_name, owner_email, owner_password } = req.body;
  if (!org_name || !org_slug || !owner_name || !owner_email || !owner_password) {
    return res.status(400).json({
      error: 'org_name, org_slug, owner_name, owner_email, owner_password are all required',
    });
  }

  // 1. Create the org
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .insert({ name: org_name, slug: org_slug })
    .select()
    .single();
  if (orgErr) {
    if (orgErr.code === '23505') return res.status(409).json({ error: 'Org slug already exists' });
    return res.status(500).json({ error: orgErr.message });
  }

  // 2. Create Supabase auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email:         owner_email,
    password:      owner_password,
    email_confirm: true,
  });
  if (authErr) {
    await supabase.from('organizations').delete().eq('id', org.id);
    return res.status(500).json({ error: authErr.message });
  }

  // 3. Create user profile linked to org
  const { error: profileErr } = await supabase
    .from('user_profiles')
    .insert({ id: authData.user.id, name: owner_name, role: 'owner', org_id: org.id });
  if (profileErr) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    await supabase.from('organizations').delete().eq('id', org.id);
    return res.status(500).json({ error: profileErr.message });
  }

  res.status(201).json({
    org:   { id: org.id, name: org.name, slug: org.slug },
    owner: { id: authData.user.id, name: owner_name, email: owner_email, role: 'owner' },
  });
});

// ──────────────────────────────────────────────
// DELETE /api/orgs/:id  — delete org + all its data
// (cascades to user_profiles, job_cards, enquiries via FK)
// ──────────────────────────────────────────────
router.delete('/:id', requireSuperAdmin, async (req, res) => {
  try {
    // Get all users in the org so we can delete their auth accounts
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('org_id', req.params.id);

    // Delete auth users
    if (users?.length) {
      await Promise.all(users.map(u => supabase.auth.admin.deleteUser(u.id)));
    }

    // Delete the org (cascades to all tables)
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
