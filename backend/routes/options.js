const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ──────────────────────────────────────────────
// GET /api/options/brands
// ──────────────────────────────────────────────
router.get('/brands', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('name')
      .order('sort_order', { ascending: true })
      .order('name',       { ascending: true });
    if (error) throw error;
    res.json(data.map(b => b.name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/options/brands
// ──────────────────────────────────────────────
router.post('/brands',
  body('name').notEmpty().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Brand name is required' });
    try {
      const { data, error } = await supabase
        .from('brands')
        .insert({ name: req.body.name, sort_order: 50 })
        .select('name')
        .single();
      if (error) {
        // Unique violation — brand already exists
        if (error.code === '23505') return res.status(409).json({ error: 'Brand already exists' });
        throw error;
      }
      res.status(201).json({ name: data.name });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ──────────────────────────────────────────────
// GET /api/options/models?brand=Samsung
// ──────────────────────────────────────────────
router.get('/models', async (req, res) => {
  const { brand } = req.query;
  if (!brand) return res.status(400).json({ error: 'brand query param required' });
  try {
    const { data, error } = await supabase
      .from('device_models')
      .select('name')
      .eq('brand', brand)
      .order('name', { ascending: true });
    if (error) throw error;
    res.json(data.map(m => m.name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/options/models
// ──────────────────────────────────────────────
router.post('/models',
  body('brand').notEmpty().trim(),
  body('name').notEmpty().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Brand and model name are required' });
    try {
      const { data, error } = await supabase
        .from('device_models')
        .insert({ brand: req.body.brand, name: req.body.name })
        .select('name')
        .single();
      if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Model already exists for this brand' });
        throw error;
      }
      res.status(201).json({ name: data.name });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
