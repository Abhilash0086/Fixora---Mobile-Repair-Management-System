import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { Badge, Loading, Empty, StatusSelect, ConfirmModal, fmtDate, fmtDateTime, toast } from '../components/Common';
import { JobCardModal } from '../components/JobCardModal';
import { Search as SearchIcon, Pencil, XCircle, Printer } from 'lucide-react';
import { printJobCard } from '../lib/printJobCard';

export default function AllJobCards() {
  const [cards,    setCards]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [filters,  setFilters]  = useState({ status: '', search: '', date: '' });
  const [cancelTarget, setCancelTarget] = useState(null); // job object pending cancel
  const [cancelling,   setCancelling]   = useState(false);

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

  function handleCancel(e, job) {
    e.stopPropagation();
    setCancelTarget(job);
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.updateJobCard(cancelTarget.job_card_id, { status: 'Cancelled' });
      toast(`${cancelTarget.job_card_id} cancelled`);
      setCancelTarget(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setCancelling(false);
    }
  }

  async function handlePrint(e, job) {
    e.stopPropagation();
    // Fetch full details (list view may be missing some fields)
    try {
      const full = await api.getJobCard(job.job_card_id);
      printJobCard(full);
    } catch {
      printJobCard(job); // fallback to list data
    }
  }

  function handleEdit(e, job) {
    e.stopPropagation();
    setSelected(job.job_card_id);
  }

  const isCancelDisabled = job =>
    ['Delivered', 'Returned', 'Cancelled'].includes(job.status) || cancelling;

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
                <th>Actions</th>
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
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {j.reported_issue}
                  </td>
                  <td>{j.technician || '—'}</td>
                  <td>{fmtDate(j.eta)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{fmtDateTime(j.created_at)}</td>
                  <td><Badge status={j.status} /></td>
                  <td>
                    <div className="row-actions" onClick={e => e.stopPropagation()}>
                      {/* Edit */}
                      <button
                        className="row-action-btn"
                        title="Edit"
                        onClick={e => handleEdit(e, j)}
                      >
                        <Pencil size={14} />
                      </button>

                      {/* Cancel */}
                      <button
                        className="row-action-btn row-action-cancel"
                        title="Cancel job"
                        disabled={isCancelDisabled(j) || cancelling === j.job_card_id}
                        onClick={e => handleCancel(e, j)}
                      >
                        <XCircle size={14} />
                      </button>

                      {/* Print */}
                      <button
                        className="row-action-btn row-action-print"
                        title="Print job card"
                        onClick={e => handlePrint(e, j)}
                      >
                        <Printer size={14} />
                      </button>
                    </div>
                  </td>
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

      {cancelTarget && (
        <ConfirmModal
          title="Cancel Job Card"
          message={`Cancel job card ${cancelTarget.job_card_id} for ${cancelTarget.customer_name}?`}
          detail={`${cancelTarget.phone_brand} ${cancelTarget.phone_model} — ${cancelTarget.reported_issue}`}
          confirmLabel="Yes, Cancel Job"
          confirmClass="btn-danger"
          loading={cancelling}
          onConfirm={confirmCancel}
          onCancel={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}
