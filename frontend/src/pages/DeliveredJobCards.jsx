import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { Badge, Loading, Empty, fmtDate, fmtDateTime } from '../components/Common';
import { JobCardModal } from '../components/JobCardModal';
import { Search as SearchIcon, Package } from 'lucide-react';

export default function DeliveredJobCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.deliveredJobCards(search);
      setCards(data);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Delivered</div>
        <div className="page-subtitle">{cards.length} device{cards.length !== 1 ? 's' : ''} delivered</div>
      </div>

      <div className="search-row">
        <div className="search-input-wrap">
          <span className="search-icon"><SearchIcon size={14} /></span>
          <input
            placeholder="Search by ID, model, phone number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>Clear</button>
        )}
      </div>

      <div className="table-wrap">
        {loading ? <Loading /> : cards.length === 0 ? (
          <Empty icon={Package} text="No delivered job cards yet" />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Job Card ID</th>
                <th>Customer</th>
                <th>Device</th>
                <th>Technician</th>
                <th>Created</th>
                <th>Delivered On</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(j => (
                <tr key={j.id} onClick={() => setSelected(j.job_card_id)}>
                  <td><span className="mono">{j.job_card_id}</span></td>
                  <td>
                    <div>{j.customer_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{j.customer_phone}</div>
                  </td>
                  <td>{j.phone_brand} {j.phone_model}</td>
                  <td>{j.technician || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{fmtDateTime(j.created_at)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{fmtDateTime(j.delivered_at)}</td>
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
