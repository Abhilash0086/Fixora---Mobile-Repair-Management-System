require('dotenv').config();
const express = require('express');
const cors = require('cors');

const jobCardsRouter  = require('./routes/jobCards');
const optionsRouter   = require('./routes/options');
const authRouter      = require('./routes/auth');
const usersRouter     = require('./routes/users');
const analyticsRouter = require('./routes/analytics');
const publicRouter    = require('./routes/public');
const enquiriesRouter = require('./routes/enquiries');
const orgsRouter      = require('./routes/orgs');

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',       authRouter);
app.use('/api/orgs',       orgsRouter);
app.use('/api/users',      usersRouter);
app.use('/api/job-cards',  jobCardsRouter);
app.use('/api/options',    optionsRouter);
app.use('/api/analytics',  analyticsRouter);
app.use('/api/public',     publicRouter);
app.use('/api/enquiries',  enquiriesRouter);

// ── Health check ────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', app: 'Fixora API' }));

// ── 404 handler ─────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server only when run directly (not imported as serverless function)
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fixora API running on port ${PORT}`);
  });
}

module.exports = app;
