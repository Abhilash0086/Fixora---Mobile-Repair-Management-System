import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ClipboardList, Users, Link2, Mail, BarChart2, Printer,
  CheckCircle, ArrowRight, Wrench, Clock, PackageCheck,
} from 'lucide-react';

const FEATURES = [
  {
    icon: ClipboardList,
    title: 'Smart Job Cards',
    desc: 'Create detailed repair records with 25+ fields. Auto-generated IDs, status tracking, and a full edit history on every card.',
  },
  {
    icon: Link2,
    title: 'Customer Portal',
    desc: 'Share a tracking link. Customers check repair status in real time — no calls, no chasing.',
  },
  {
    icon: Users,
    title: 'Multi-Technician',
    desc: 'Assign jobs, control access by role, and track each technician\'s performance and turnaround time.',
  },
  {
    icon: Mail,
    title: 'Email Notifications',
    desc: 'Customers receive a branded email automatically on every repair status change.',
  },
  {
    icon: BarChart2,
    title: 'Analytics',
    desc: 'Revenue totals, monthly trends, and technician performance metrics — all in one clean dashboard.',
  },
  {
    icon: Printer,
    title: 'Print Job Slips',
    desc: 'Generate a formatted print-ready slip for any job card in a single click. Signature line included.',
  },
];

const STEPS = [
  {
    num: '01',
    icon: ClipboardList,
    title: 'Log the device',
    desc: 'Create a job card when the customer drops in. Capture their details, device condition, pattern or password, and the reported issue.',
  },
  {
    num: '02',
    icon: Wrench,
    title: 'Track the repair',
    desc: 'Assign to a technician. Update the status as work progresses. Every change is timestamped and logged automatically.',
  },
  {
    num: '03',
    icon: PackageCheck,
    title: 'Notify and deliver',
    desc: 'Customer gets an email when the device is ready. Hand it over, mark it delivered. The record is complete.',
  },
];

const STATUSES = [
  { label: 'Pending',            color: '#a16207', bg: '#fef9c3' },
  { label: 'In Progress',        color: '#1d4ed8', bg: '#dbeafe' },
  { label: 'Ready for Delivery', color: '#15803d', bg: '#dcfce7' },
  { label: 'Delivered',          color: '#6d28d9', bg: '#ede9fe' },
  { label: 'Delayed',            color: '#c2410c', bg: '#ffedd5' },
  { label: 'Returned',           color: '#dc2626', bg: '#fee2e2' },
  { label: 'Cancelled',          color: '#4b5563', bg: '#f3f4f6' },
];

export default function Landing() {
  const { user, loading, guestLogin } = useAuth();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    if (!loading && user && user.role !== 'guest') navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  async function handleDemo() {
    setDemoLoading(true);
    try {
      await guestLogin();
      navigate('/dashboard', { replace: true });
    } catch {
      setDemoLoading(false);
    }
  }

  return (
    <div className="lp">

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <Wrench size={18} strokeWidth={2.25} />
            Fixora
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="lp-nav-demo" onClick={handleDemo} disabled={demoLoading}>
              {demoLoading ? 'Loading…' : 'Try Demo'}
            </button>
            <Link to="/login" className="lp-nav-signin">Sign In →</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">

          <div className="lp-hero-text">
            <div className="lp-eyebrow">Repair Shop Management</div>
            <h1 className="lp-h1">
              Repair management<br />
              built for the<br />
              <span className="lp-h1-accent">shop floor.</span>
            </h1>
            <p className="lp-hero-sub">
              Fixora helps repair shops manage job cards, coordinate
              technicians, and keep customers informed — from intake
              to delivery.
            </p>
            <Link to="/login" className="lp-btn-primary">
              Get Started <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
          </div>

          {/* ── UI Mockup ── */}
          <div className="lp-mockup">
            <div className="lp-mockup-chrome">
              <div className="lp-mockup-dots">
                <span /><span /><span />
              </div>
              <div className="lp-mockup-url">fixora.app/dashboard</div>
            </div>
            <div className="lp-mockup-body">
              <div className="lp-mock-label">Dashboard</div>
              <div className="lp-mock-stats">
                {[
                  { l: 'Total',       v: '52', c: '#f97316' },
                  { l: 'In Progress', v: '14', c: '#60a5fa' },
                  { l: 'Ready',       v: '6',  c: '#4ade80' },
                  { l: 'Delivered',   v: '29', c: '#a78bfa' },
                ].map(s => (
                  <div key={s.l} className="lp-mock-stat" style={{ '--mc': s.c }}>
                    <div className="lp-mock-stat-n">{s.v}</div>
                    <div className="lp-mock-stat-l">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="lp-mock-rows">
                {[
                  { id: 'FX-2026-00052', dev: 'iPhone 15 Pro',      st: 'In Progress',        sc: '#60a5fa' },
                  { id: 'FX-2026-00051', dev: 'Samsung Galaxy S24', st: 'Ready for Delivery',  sc: '#4ade80' },
                  { id: 'FX-2026-00050', dev: 'Realme 12 Pro',      st: 'Pending',             sc: '#facc15' },
                ].map(r => (
                  <div key={r.id} className="lp-mock-row">
                    <span className="lp-mock-id">{r.id}</span>
                    <span className="lp-mock-dev">{r.dev}</span>
                    <span className="lp-mock-st" style={{ color: r.sc }}>{r.st}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Status strip ─────────────────────────────────── */}
      <div className="lp-status-strip">
        <div className="lp-status-strip-label">7 repair statuses, tracked in real time</div>
        <div className="lp-status-pills">
          {STATUSES.map(s => (
            <span key={s.label} className="lp-status-pill"
              style={{ background: s.bg, color: s.color }}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-section-eyebrow">Features</div>
          <h2 className="lp-h2">Everything your repair shop needs</h2>
          <p className="lp-section-sub">No spreadsheets. No paper logs. No missed pickups.</p>
          <div className="lp-features">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="lp-feat">
                  <div className="lp-feat-icon"><Icon size={20} strokeWidth={1.75} /></div>
                  <div className="lp-feat-title">{f.title}</div>
                  <div className="lp-feat-desc">{f.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="lp-section lp-steps-section">
        <div className="lp-section-inner">
          <div className="lp-section-eyebrow">How it works</div>
          <h2 className="lp-h2">Simple. Structured. Sorted.</h2>
          <div className="lp-steps">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.num} className="lp-step">
                  <div className="lp-step-num">{s.num}</div>
                  <div className="lp-step-icon"><Icon size={24} strokeWidth={1.5} /></div>
                  <div className="lp-step-title">{s.title}</div>
                  <div className="lp-step-desc">{s.desc}</div>
                  {i < STEPS.length - 1 && <div className="lp-step-arrow"><ArrowRight size={20} /></div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Customer portal callout ───────────────────────── */}
      <section className="lp-section lp-portal-section">
        <div className="lp-section-inner lp-portal-grid">
          <div className="lp-portal-text">
            <div className="lp-section-eyebrow">Customer Portal</div>
            <h2 className="lp-h2 lp-h2-left">Keep customers in the loop — automatically.</h2>
            <p className="lp-section-sub lp-sub-left">
              Every job card has a public tracking page. Share the link once.
              Customers see live status, repair progress, and technician notes —
              without ever calling you.
            </p>
            <div className="lp-checks">
              {[
                'No customer login required',
                'Email updates on every status change',
                'Sensitive data never exposed publicly',
              ].map(t => (
                <div key={t} className="lp-check">
                  <CheckCircle size={15} strokeWidth={2.5} className="lp-check-icon" />
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="lp-portal-card">
            <div className="lp-portal-card-header">
              <span className="lp-portal-brand">Fixora</span>
              <span className="lp-portal-brand-sub">Repair Status</span>
            </div>
            <div className="lp-portal-card-body">
              <div className="lp-portal-id">FX-2026-00051</div>
              <div className="lp-portal-device">Samsung Galaxy S24</div>
              <div className="lp-portal-status-wrap">
                <span className="lp-portal-status">✓ Ready for Delivery</span>
              </div>
              <div className="lp-portal-msg">
                Your device is repaired and ready for pickup. Please visit us soon.
              </div>
              <div className="lp-portal-steps">
                {['Received', 'In Progress', 'Ready', 'Delivered'].map((s, i) => (
                  <div key={s} className={`lp-portal-step ${i <= 2 ? 'done' : ''}`}>
                    <div className="lp-portal-step-dot" />
                    <div className="lp-portal-step-label">{s}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="lp-cta">
        <div className="lp-section-inner lp-cta-inner">
          <h2 className="lp-cta-title">Ready to organise your repair shop?</h2>
          <p className="lp-cta-sub">Sign in and start managing repairs the right way.</p>
          <Link to="/login" className="lp-btn-primary lp-btn-lg">
            Get Started <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-logo lp-logo-muted">
            <Wrench size={15} strokeWidth={2.25} />
            Fixora
          </div>
          <div className="lp-footer-copy">© 2026 Fixora. All rights reserved.</div>
        </div>
      </footer>

    </div>
  );
}
