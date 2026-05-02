import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { Badge, Loading, Empty, StatusSelect, ConfirmModal, fmtDate, fmtDateTime, toast, useGuestGate, STATUSES } from '../components/Common';
import { JobCardModal } from '../components/JobCardModal';
import { Search as SearchIcon, Pencil, XCircle, Printer, Download } from 'lucide-react';
import { printJobCard } from '../lib/printJobCard';
import { exportCSV } from '../lib/csvExport';

const EMPTY_FILTERS = { status: '', search: '', date_from: '', date_to: '', technician: '', brand: '' };

export default function AllJobCards() {
  const [cards,       setCards]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [filters,     setFilters]     = useState(EMPTY_FILTERS);
  const [cancelTarget,  setCancelTarget]  = useState(null);
  const [cancelling,    setCancelling]    = useState(false);
  const [statusSaving,  setStatusSaving]  = useState(null); // job_card_id being saved
  const [technicians, setTechnicians] = useState([]);
  const [brands,      setBrands]      = useState([]);

  // Load filter options once
  useEffect(() => {
    api.getUsers().then(users => setTechnicians(users.filter(u => u.role === 'technician'))).catch(() => {});
    api.getBrands().then(setBrands).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status)     params.status     = filters.status;
      if (filters.search)     params.search     = filters.search;
      if (filters.date_from)  params.date_from  = filters.date_from;
      if (filters.date_to)    params.date_to    = filters.date_to;
      if (filters.technician) params.technician = filters.technician;
      if (filters.brand)      params.brand      = filters.brand;
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
  const hasFilters = Object.values(filters).some(Boolean);
  const { gate, modal } = useGuestGate();

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

  async function handleStatusChange(e, job) {
    e.stopPropagation();
    const newStatus = e.target.value;
    if (newStatus === job.status) return;
    setStatusSaving(job.job_card_id);
    try {
      await api.updateJobCard(job.job_card_id, { status: newStatus });
      setCards(prev => prev.map(c =>
        c.job_card_id === job.job_card_id ? { ...c, status: newStatus } : c
      ));
      toast(`Status → ${newStatus}`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setStatusSaving(null);
    }
  }

  const isCancelDisabled = job =>
    ['Delivered', 'Returned', 'Cancelled'].includes(job.status) || cancelling;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">All Job Cards</div>
          <div className="page-subtitle">{cards.length} record{cards.length !== 1 ? 's' : ''}</div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          disabled={cards.length === 0}
          onClick={() => {
            const rows = cards.map(j => ({
              'Job Card ID':     j.job_card_id,
              'Customer Name':   j.customer_name,
              'Customer Phone':  j.customer_phone,
              'Brand':           j.phone_brand,
              'Model':           j.phone_model,
              'Issue':           j.reported_issue,
              'Technician':      j.technician || '',
              'Status':          j.status,
              'ETA':             j.eta || '',
              'Estimated (₹)':   j.estimated_amount ?? '',
              'Advance (₹)':     j.advance_amount ?? '',
              'Created':         j.created_at,
            }));
            const label = filters.date_from && filters.date_to
              ? `${filters.date_from}_to_${filters.date_to}`
              : new Date().toISOString().slice(0, 10);
            exportCSV(rows, `job-cards_${label}.csv`);
          }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="filter-bar">
        <div className="search-input-wrap filter-search">
          <span className="search-icon"><SearchIcon size={14} /></span>
          <input
            placeholder="Search by ID, name, phone, model..."
            value={filters.search}
            onChange={e => setF('search', e.target.value)}
          />
        </div>
        <div className="filter-row">
          <StatusSelect value={filters.status} onChange={v => setF('status', v)} />
          <select value={filters.brand} onChange={e => setF('brand', e.target.value)}>
            <option value="">All Brands</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={filters.technician} onChange={e => setF('technician', e.target.value)}>
            <option value="">All Technicians</option>
            {technicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
          <input
            type="date"
            value={filters.date_from}
            max={filters.date_to || undefined}
            onChange={e => setF('date_from', e.target.value)}
            title="From date"
          />
          <span style={{ fontSize: 12, color: 'var(--text-3)', alignSelf: 'center' }}>–</span>
          <input
            type="date"
            value={filters.date_to}
            min={filters.date_from || undefined}
            onChange={e => setF('date_to', e.target.value)}
            title="To date"
          />
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear
            </button>
          )}
        </div>
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
                  <td onClick={e => e.stopPropagation()}>
                    <select
                      className={`inline-status-select status-${j.status.replace(/\s+/g, '-')}`}
                      value={j.status}
                      disabled={statusSaving === j.job_card_id}
                      onChange={e => gate(() => handleStatusChange(e, j))}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <div className="row-actions" onClick={e => e.stopPropagation()}>
                      {/* Edit */}
                      <button
                        className="row-action-btn"
                        title="Edit"
                        onClick={e => { e.stopPropagation(); gate(() => handleEdit(e, j)); }}
                      >
                        <Pencil size={14} />
                      </button>

                      {/* Cancel */}
                      <button
                        className="row-action-btn row-action-cancel"
                        title="Cancel job"
                        disabled={isCancelDisabled(j) || cancelling === j.job_card_id}
                        onClick={e => { e.stopPropagation(); gate(() => handleCancel(e, j)); }}
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

      {modal}
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
