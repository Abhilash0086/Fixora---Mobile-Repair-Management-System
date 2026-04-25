import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Badge, Loading, fmtDateTime, toast, useGuestGate } from '../components/Common';
import { JobCardModal } from '../components/JobCardModal';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, PhoneCall, Trash2, X as XIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const STATS = [
  { key: 'total',              label: 'Total Jobs',          color: '#f97316' },
  { key: 'pending',            label: 'Pending',             color: '#facc15' },
  { key: 'in_progress',        label: 'In Progress',         color: '#60a5fa' },
  { key: 'ready_for_delivery', label: 'Ready for Delivery',  color: '#4ade80' },
  { key: 'delivered',          label: 'Delivered',           color: '#a78bfa' },
  { key: 'returned',           label: 'Returned',            color: '#f87171' },
  { key: 'delayed',            label: 'Delayed',             color: '#fb923c' },
];

const EMPTY_ENQ = { name: '', contact_no: '', device: '', description: '' };

export default function Dashboard() {
  const [summary,    setSummary]    = useState(null);
  const [enquiries,  setEnquiries]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [showModal,  setShowModal]  = useState(false);
  const [form,       setForm]       = useState(EMPTY_ENQ);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gate, modal } = useGuestGate();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [dash, enqs] = await Promise.all([
        api.dashboard(),
        api.getEnquiries(true),
      ]);
      setSummary(dash.summary);
      setEnquiries(enqs);
    } finally {
      setLoading(false);
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submitEnquiry(e) {
    e.preventDefault();
    if (!form.name.trim()) { toast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      const created = await api.createEnquiry(form);
      setEnquiries(prev => [created, ...prev]);
      setForm(EMPTY_ENQ);
      setShowModal(false);
      toast('Enquiry logged');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeleting(id);
    try {
      await api.deleteEnquiry(id);
      setEnquiries(prev => prev.filter(e => e.id !== id));
      toast('Enquiry removed');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeleting(null);
    }
  }

  function fmtTime(str) {
    if (!str) return '—';
    return new Date(str).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  if (loading) return <div className="page"><Loading /></div>;

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">{today}</div>
      </div>

      {/* ── Job card summary stats ── */}
      <div className="stat-grid">
        {STATS.map(s => (
          <div key={s.key} className="stat-card" style={{ '--stat-color': s.color }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{summary[s.key]}</div>
          </div>
        ))}
      </div>

      {/* ── Today's Enquiries ── */}
      <div className="section-header">
        <div className="section-title">
          Today's Enquiries
          <span className="section-count">{enquiries.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {user?.role === 'admin' && (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/new')}>
              + New Job Card
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => gate(() => setShowModal(true))}>
            + New Enquiry
          </button>
        </div>
      </div>

      <div className="table-wrap">
        {enquiries.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><PhoneCall size={40} strokeWidth={1.5} /></div>
            <div className="empty-text">No enquiries today</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Device</th>
                <th>Description</th>
                {user?.role === 'admin' && <th></th>}
              </tr>
            </thead>
            <tbody>
              {enquiries.map(e => (
                <tr key={e.id}>
                  <td style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                    {fmtTime(e.created_at)}
                  </td>
                  <td style={{ fontWeight: 500 }}>{e.name}</td>
                  <td style={{ fontSize: 13 }}>{e.contact_no || '—'}</td>
                  <td style={{ fontSize: 13 }}>{e.device || '—'}</td>
                  <td style={{ fontSize: 13, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.description || '—'}
                  </td>
                  {user?.role === 'admin' && (
                    <td>
                      <button
                        className="row-action-btn row-action-cancel"
                        title="Delete enquiry"
                        disabled={deleting === e.id}
                        onClick={() => gate(() => handleDelete(e.id))}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── New Enquiry Modal ── */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">New Enquiry</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <XIcon size={18} />
              </button>
            </div>
            <form onSubmit={submitEnquiry} style={{ padding: '20px 24px 24px' }}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="field">
                  <label>Name *</label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Customer name"
                    required
                  />
                </div>
                <div className="field">
                  <label>Contact Number</label>
                  <input
                    type="tel"
                    value={form.contact_no}
                    onChange={e => set('contact_no', e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                <div className="field">
                  <label>Device</label>
                  <input
                    value={form.device}
                    onChange={e => set('device', e.target.value)}
                    placeholder="e.g. Samsung Galaxy S23"
                  />
                </div>
                <div className="field">
                  <label>Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    placeholder="Issue or query described by customer..."
                    style={{ minHeight: 80 }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Log Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <JobCardModal
          jobCardId={selected}
          onClose={() => setSelected(null)}
          onUpdated={load}
        />
      )}
      {modal}
    </div>
  );
}
