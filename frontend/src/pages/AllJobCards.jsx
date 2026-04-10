import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { Badge, Loading, Empty, StatusSelect, fmtDate, fmtDateTime } from '../components/Common';
import { JobCardModal } from '../components/JobCardModal';
import { Search as SearchIcon } from 'lucide-react';

export default function AllJobCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ status: '', search: '', date: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.date)   params.date   = filters.date;
      const data = await api.listJobCards(params);
      setCards(data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">All Job Cards</div>
        <div className="page-subtitle">{cards.length} record{cards.length !== 1 ? 's' : ''}</div>
      </div>

      <div className="search-row">
        <div className="search-input-wrap">
          <span className="search-icon"><SearchIcon size={14} /></span>
          <input
            placeholder="Search by ID, model, customer..."
            value={filters.search}
            onChange={e => setF('search', e.target.value)}
          />
        </div>
        <StatusSelect value={filters.status} onChange={v => setF('status', v)} style={{ width: 180 }} />
        <input
          type="date"
          value={filters.date}
          onChange={e => setF('date', e.target.value)}
          style={{ width: 160 }}
        />
        {(filters.search || filters.status || filters.date) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', search: '', date: '' })}>
            Clear
          </button>
        )}
      </div>

      <div className="table-wrap">
        {loading ? <Loading /> : cards.length === 0 ? <Empty /> : (
          <table>
            <thead>
              <tr>
                <th>Job Card ID</th>
                <th>Customer</th>
                <th>Device</th>
                <th>Issue</th>
                <th>Technician</th>
                <th>ETA</th>
                <th>Created</th>
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
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.reported_issue}</td>
                  <td>{j.technician || '—'}</td>
                  <td>{fmtDate(j.eta)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{fmtDateTime(j.created_at)}</td>
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
