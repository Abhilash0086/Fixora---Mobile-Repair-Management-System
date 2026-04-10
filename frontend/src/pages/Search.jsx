import { useState } from 'react';
import { api } from '../lib/api';
import { Badge, fmtDate, fmtDateTime } from '../components/Common';
import { JobCardModal } from '../components/JobCardModal';
import { Search as SearchIcon, SearchX } from 'lucide-react';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  async function doSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await api.listJobCards({ search: query.trim() });
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div className="page-title">Search</div>
        <div className="page-subtitle">Find job cards by ID, model, or customer phone number</div>
      </div>

      <form onSubmit={doSearch}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          <div className="search-input-wrap" style={{ flex: 1 }}>
            <span className="search-icon"><SearchIcon size={14} /></span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Enter Job Card ID (FX-2026-00001), phone model, or customer number..."
              style={{ fontSize: 15 }}
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {results === null && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>
          <div style={{ marginBottom: 16 }}><SearchIcon size={40} strokeWidth={1.5} /></div>
          <div>Search by Job Card ID, phone model, or customer phone number</div>
        </div>
      )}

      {results !== null && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>
          <div style={{ marginBottom: 16 }}><SearchX size={40} strokeWidth={1.5} /></div>
          <div>No results found for <strong style={{ color: 'var(--text-2)' }}>"{query}"</strong></div>
        </div>
      )}

      {results !== null && results.length > 0 && (
        <>
          <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-3)' }}>
            {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Job Card ID</th>
                  <th>Customer</th>
                  <th>Device</th>
                  <th>Issue</th>
                  <th>ETA</th>
                  <th>Created</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map(j => (
                  <tr key={j.id} onClick={() => setSelected(j.job_card_id)}>
                    <td><span className="mono">{j.job_card_id}</span></td>
                    <td>
                      <div>{j.customer_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{j.customer_phone}</div>
                    </td>
                    <td>{j.phone_brand} {j.phone_model}</td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {j.reported_issue}
                    </td>
                    <td>{fmtDate(j.eta)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{fmtDateTime(j.created_at)}</td>
                    <td><Badge status={j.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selected && (
        <JobCardModal
          jobCardId={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            const q = query;
            setQuery(q);
          }}
        />
      )}
    </div>
  );
}
