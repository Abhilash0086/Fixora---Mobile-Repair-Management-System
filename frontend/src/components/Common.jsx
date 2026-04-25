import { useState, useEffect } from 'react';
import { ClipboardList, X, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// ─── Status Badge ────────────────────────────────────────────
export function Badge({ status }) {
  const key = status.replace(/\s+/g, '-');
  const dots = {
    'Pending':            '#facc15',
    'In Progress':        '#60a5fa',
    'Ready for Delivery': '#4ade80',
    'Delivered':          '#a78bfa',
    'Returned':           '#f87171',
    'Delayed':            '#fb923c',
    'Cancelled':          '#9ca3af',
  };
  return (
    <span className={`badge badge-${key}`}>
      <span className="badge-dot" style={{ background: dots[status] }} />
      {status}
    </span>
  );
}

// ─── Loading ─────────────────────────────────────────────────
export function Loading() {
  return (
    <div className="loading">
      <div className="spinner" />
      <div>Loading...</div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────
export function Empty({ icon: Icon = ClipboardList, text = 'No records found' }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon size={40} strokeWidth={1.5} /></div>
      <div className="empty-text">{text}</div>
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────
let _setToasts = null;

export function ToastArea() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => { _setToasts = setToasts; return () => { _setToasts = null; }; }, []);
  return (
    <div className="toast-area">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}

export function toast(msg, type = 'success') {
  if (!_setToasts) return;
  const id = Date.now();
  _setToasts(p => [...p, { id, msg, type }]);
  setTimeout(() => _setToasts(p => p.filter(t => t.id !== id)), 3000);
}

// ─── Status Select ───────────────────────────────────────────
export const STATUSES = ['Pending', 'In Progress', 'Ready for Delivery', 'Delivered', 'Returned', 'Delayed', 'Cancelled'];

export function StatusSelect({ value, onChange, ...props }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} {...props}>
      <option value="">All statuses</option>
      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

// ─── Section Title ───────────────────────────────────────────
export function SectionTitle({ children }) {
  return <div className="form-section-title">{children}</div>;
}

// ─── Radio Pill Group ─────────────────────────────────────────
export function RadioGroup({ label, options, value, onChange }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div className="radio-group">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            className={`radio-btn${value === opt ? ' active' : ''}`}
            onClick={() => onChange(value === opt ? '' : opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Phone Input ─────────────────────────────────────────────
export const COUNTRY_CODES = [
  { code: '+91',  label: '🇮🇳 +91'  },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+966', label: '🇸🇦 +966' },
  { code: '+974', label: '🇶🇦 +974' },
  { code: '+965', label: '🇰🇼 +965' },
  { code: '+968', label: '🇴🇲 +968' },
  { code: '+973', label: '🇧🇭 +973' },
  { code: '+65',  label: '🇸🇬 +65'  },
  { code: '+60',  label: '🇲🇾 +60'  },
  { code: '+1',   label: '🇺🇸 +1'   },
  { code: '+44',  label: '🇬🇧 +44'  },
  { code: '+61',  label: '🇦🇺 +61'  },
  { code: '+92',  label: '🇵🇰 +92'  },
  { code: '+880', label: '🇧🇩 +880' },
  { code: '+94',  label: '🇱🇰 +94'  },
  { code: '+977', label: '🇳🇵 +977' },
];

// Parse "+91 9876543210" → { code: "+91", number: "9876543210" }
function parsePhone(value = '') {
  if (!value) return { code: '+91', number: '' };
  const match = value.match(/^(\+\d{1,4})\s?(.*)$/);
  if (match) return { code: match[1], number: match[2] };
  return { code: '+91', number: value };
}

export function PhoneInput({ value = '', onChange, placeholder = 'Mobile number' }) {
  const { code, number } = parsePhone(value);

  const setCode   = c => onChange(number ? `${c} ${number}` : c);
  const setNumber = n => onChange(n ? `${code} ${n}` : '');

  return (
    <div className="phone-input-wrap">
      <select
        className="phone-code-select"
        value={code}
        onChange={e => setCode(e.target.value)}
      >
        {COUNTRY_CODES.map(c => (
          <option key={c.code} value={c.code}>{c.label}</option>
        ))}
      </select>
      <input
        type="tel"
        value={number}
        onChange={e => setNumber(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ─── Confirm Modal ───────────────────────────────────────────
export function ConfirmModal({ title, message, detail, confirmLabel = 'Confirm', confirmClass = 'btn-danger', onConfirm, onCancel, loading = false }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text)', lineHeight: 1.6 }}>{message}</p>
          {detail && (
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>{detail}</p>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            Keep
          </button>
          <button className={`btn ${confirmClass}`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Guest Modal ──────────────────────────────────────────────
export function GuestModal({ onClose }) {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  function handleSignIn() {
    logout();
    onClose();
    navigate('/login');
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={16} strokeWidth={2} style={{ color: 'var(--accent)' }} />
            <div className="modal-title">Sign in required</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 24 }}>
            You're exploring Fixora as a guest. Sign in to create job cards,
            manage enquiries, and use all features.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Continue Exploring</button>
            <button className="btn btn-primary" onClick={handleSignIn}>Sign In</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── useGuestGate hook ────────────────────────────────────────
export function useGuestGate() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const isGuest = user?.role === 'guest';

  function gate(fn) {
    if (isGuest) { setShow(true); return; }
    fn?.();
  }

  const modal = show ? <GuestModal onClose={() => setShow(false)} /> : null;
  return { gate, modal, isGuest };
}

// ─── Format helpers ───────────────────────────────────────────
export function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
