const express = require('express');
const supabase = require('../lib/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireAdmin);

// GET /api/users
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

// POST /api/users
router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password and role are required' });
  }
  if (!['admin', 'technician'].includes(role)) {
    return res.status(400).json({ error: 'Role must be admin or technician' });
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

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
