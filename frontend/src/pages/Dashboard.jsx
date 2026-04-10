import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Badge, Loading, fmtDate, fmtDateTime } from '../components/Common';
import { JobCardModal } from '../components/JobCardModal';
import { useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const STATS = [
  { key: 'total',             label: 'Total Jobs',          color: '#f97316' },
  { key: 'pending',           label: 'Pending',             color: '#facc15' },
  { key: 'in_progress',       label: 'In Progress',         color: '#60a5fa' },
  { key: 'ready_for_delivery',label: 'Ready for Delivery',  color: '#4ade80' },
  { key: 'delivered',         label: 'Delivered',           color: '#a78bfa' },
  { key: 'returned',          label: 'Returned',            color: '#f87171' },
  { key: 'delayed',           label: 'Delayed',             color: '#fb923c' },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const d = await api.dashboard();
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="page"><Loading /></div>;

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">{today}</div>
      </div>

      <div className="stat-grid">
        {STATS.map(s => (
          <div key={s.key} className="stat-card" style={{ '--stat-color': s.color }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{data.summary[s.key]}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 600 }}>
          Today's Enquiries
          <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
            {data.today_enquiries.length} job{data.today_enquiries.length !== 1 ? 's' : ''}
          </span>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/new')}>+ New Job Card</button>
        )}
      </div>

      <div className="table-wrap">
        {data.today_enquiries.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><ClipboardList size={40} strokeWidth={1.5} /></div>
            <div className="empty-text">No job cards created today</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Job Card ID</th>
                <th>Customer</th>
                <th>Device</th>
                <th>Issue</th>
                <th>Technician</th>
                <th>ETA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.today_enquiries.map(j => (
                <tr key={j.id} onClick={() => setSelected(j.job_card_id)}>
                  <td><span className="mono">{j.job_card_id}</span></td>
                  <td>
                    <div>{j.customer_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{j.customer_phone}</div>
                  </td>
                  <td>{j.phone_brand} {j.phone_model}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.reported_issue}</td>
                  <td>{j.technician || '—'}</td>
                  <td>{fmtDate(j.eta)}</td>
                  <td><Badge status={j.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <JobCardModal
          jobCardId={selected}
          onClose={() => setSelected(null)}
          onUpdated={load}
        />
      )}
    </div>
  );
}
