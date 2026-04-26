const express = require('express');
const supabase = require('../lib/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireAdmin);

// ──────────────────────────────────────────────
// GET /api/users
// ──────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, name, role, created_at')
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/users
// Owner  → can create owner, admin, technician
// Admin  → can create technician only
// ──────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password and role are required' });
  }

  const callerRole = req.user.role;

  // Admins can only create technicians
  if (callerRole === 'admin' && role !== 'technician') {
    return res.status(403).json({ error: 'Admins can only create technician accounts' });
  }
  // Valid roles
  if (!['owner', 'admin', 'technician'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;

    const { error: profileErr } = await supabase
      .from('user_profiles')
      .insert({ id: data.user.id, name, role });
    if (profileErr) {
      await supabase.auth.admin.deleteUser(data.user.id);
      throw profileErr;
    }

    res.status(201).json({ id: data.user.id, name, role, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// DELETE /api/users/:id
// Owner  → can delete admin/technician (not owner, not self)
// Admin  → can delete technician only (not admin, owner, or self)
// ──────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const targetId   = req.params.id;
  const callerId   = req.user.id;
  const callerRole = req.user.role;

  // Nobody can delete themselves
  if (targetId === callerId) {
    return res.status(403).json({ error: 'You cannot delete your own account' });
  }

  try {
    // Fetch the target user's role
    const { data: target, error: fetchErr } = await supabase
      .from('user_profiles')
      .select('role, name')
      .eq('id', targetId)
      .single();
    if (fetchErr || !target) return res.status(404).json({ error: 'User not found' });

    // Owner accounts can never be deleted
    if (target.role === 'owner') {
      return res.status(403).json({ error: 'Owner accounts cannot be deleted' });
    }

    // Admins can only delete technicians
    if (callerRole === 'admin' && target.role !== 'technician') {
      return res.status(403).json({ error: 'Admins can only delete technician accounts' });
    }

    const { error } = await supabase.auth.admin.deleteUser(targetId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
