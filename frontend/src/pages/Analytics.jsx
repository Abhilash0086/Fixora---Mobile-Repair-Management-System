import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Loading } from '../components/Common';
import { TrendingUp, Users, IndianRupee, BarChart2, Download } from 'lucide-react';
import { exportCSV } from '../lib/csvExport';

const PERIODS = [
  { label: 'This Week',     days: 7   },
  { label: 'This Month',    days: 30  },
  { label: 'Last 3 Months', days: 90  },
  { label: 'This Year',     days: 365 },
  { label: 'All Time',      days: null },
];

function getPeriodDates(days) {
  const to   = new Date();
  const from = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;
  return {
    from: from ? from.toISOString().slice(0, 10) : null,
    to:   to.toISOString().slice(0, 10),
  };
}

function fmt(n) {
  return new Intl.NumberFormat('en-IN').format(n ?? 0);
}

function pct(a, b) {
  return b ? Math.round((a / b) * 100) : 0;
}

export default function Analytics() {
  const [periodIdx,   setPeriodIdx]   = useState(1);
  const [revenue,     setRevenue]     = useState(null);
  const [technicians, setTechnicians] = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => { load(); }, [periodIdx]);

  async function load() {
    setLoading(true);
    try {
      const { from, to } = getPeriodDates(PERIODS[periodIdx].days);
      const params = { to };
      if (from) params.from = from;

      const [rev, techs] = await Promise.all([
        api.getRevenue(params),
        api.getTechnicianStats(params),
      ]);
      setRevenue(rev);
      setTechnicians(techs);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Analytics</div>
          <div className="page-subtitle">Revenue and technician performance</div>
        </div>
      </div>

      {/* Period selector */}
      <div className="analytics-period-row">
        {PERIODS.map((p, i) => (
          <button
            key={p.label}
            className={`analytics-period-btn${periodIdx === i ? ' active' : ''}`}
            onClick={() => setPeriodIdx(i)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}><Loading /></div>
      ) : (
        <>
          {/* ── Revenue Summary ── */}
          <div className="analytics-section-title">
            <IndianRupee size={15} />
            Revenue Summary
          </div>

          <div className="analytics-stat-grid">
            <div className="analytics-stat-card">
              <div className="asc-label">Total Jobs</div>
              <div className="asc-value">{fmt(revenue.summary.total_jobs)}</div>
              <div className="asc-sub">{revenue.summary.delivered_jobs} delivered</div>
            </div>

            <div className="analytics-stat-card">
              <div className="asc-label">Total Estimated</div>
              <div className="asc-value">₹{fmt(revenue.summary.total_estimated)}</div>
              <div className="asc-sub">Avg ₹{fmt(revenue.summary.avg_repair_value)} / job</div>
            </div>

            <div className="analytics-stat-card">
              <div className="asc-label">Advance Collected</div>
              <div className="asc-value" style={{ color: 'var(--s-ready)' }}>
                ₹{fmt(revenue.summary.total_advance)}
              </div>
              <div className="asc-sub">
                {pct(revenue.summary.total_advance, revenue.summary.total_estimated)}% of estimated
              </div>
            </div>

            <div className="analytics-stat-card">
              <div className="asc-label">Pending Collection</div>
              <div className="asc-value" style={{ color: 'var(--s-delayed)' }}>
                ₹{fmt(revenue.summary.pending_collection)}
              </div>
              <div className="asc-sub">Outstanding balance</div>
            </div>
          </div>

          {/* ── Monthly Breakdown ── */}
          {revenue.monthly.length > 0 && (
            <>
              <div className="analytics-section-title" style={{ marginTop: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                  <TrendingUp size={15} />
                  Monthly Breakdown
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}
                  onClick={() => {
                    const rows = [...revenue.monthly].reverse().map(m => ({
                      'Month':          new Date(m.month + '-02').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
                      'Jobs':           m.jobs,
                      'Delivered':      m.delivered,
                      'Estimated (₹)':  Math.round(m.estimated),
                      'Advance (₹)':    Math.round(m.advance),
                      'Completion %':   pct(m.delivered, m.jobs),
                    }));
                    exportCSV(rows, `monthly-breakdown_${PERIODS[periodIdx].label.replace(/\s+/g, '-').toLowerCase()}.csv`);
                  }}
                >
                  <Download size={13} />
                  CSV
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th style={{ textAlign: 'right' }}>Jobs</th>
                      <th style={{ textAlign: 'right' }}>Delivered</th>
                      <th style={{ textAlign: 'right' }}>Estimated (₹)</th>
                      <th style={{ textAlign: 'right' }}>Advance (₹)</th>
                      <th>Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...revenue.monthly].reverse().map(m => {
                      const rate = pct(m.delivered, m.jobs);
                      return (
                        <tr key={m.month}>
                          <td style={{ fontWeight: 500 }}>
                            {new Date(m.month + '-02').toLocaleDateString('en-IN', {
                              month: 'long', year: 'numeric',
                            })}
                          </td>
                          <td style={{ textAlign: 'right' }}>{m.jobs}</td>
                          <td style={{ textAlign: 'right', color: 'var(--s-ready)' }}>{m.delivered}</td>
                          <td style={{ textAlign: 'right' }}>{fmt(Math.round(m.estimated))}</td>
                          <td style={{ textAlign: 'right' }}>{fmt(Math.round(m.advance))}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="mini-bar-wrap">
                                <div className="mini-bar" style={{ width: `${rate}%` }} />
                              </div>
                              <span style={{ fontSize: 12, minWidth: 30 }}>{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Technician Performance ── */}
          <div className="analytics-section-title" style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <Users size={15} />
              Technician Performance
            </div>
            {technicians.length > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}
                onClick={() => {
                  const rows = technicians.map(t => ({
                    'Technician':      t.name,
                    'Total':           t.total,
                    'Delivered':       t.delivered,
                    'In Progress':     t.in_progress,
                    'Pending':         t.pending,
                    'Ready':           t.ready_for_delivery,
                    'Delayed':         t.delayed,
                    'Avg Days':        t.avg_turnaround_days ?? '',
                    'Estimated (₹)':   t.total_estimated,
                    'Completion %':    t.completion_rate,
                  }));
                  exportCSV(rows, `technicians_${PERIODS[periodIdx].label.replace(/\s+/g, '-').toLowerCase()}.csv`);
                }}
              >
                <Download size={13} />
                CSV
              </button>
            )}
          </div>

          {technicians.length === 0 ? (
            <div style={{ color: 'var(--text-3)', padding: '12px 0' }}>
              No data for this period.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Technician</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ textAlign: 'right' }}>Delivered</th>
                    <th style={{ textAlign: 'right' }}>Active</th>
                    <th style={{ textAlign: 'right' }}>Delayed</th>
                    <th style={{ textAlign: 'right' }}>Avg Days</th>
                    <th style={{ textAlign: 'right' }}>Estimated (₹)</th>
                    <th>Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {technicians.map(t => {
                    const active = t.in_progress + t.pending + t.ready_for_delivery;
                    return (
                      <tr key={t.name}>
                        <td style={{ fontWeight: 500 }}>{t.name}</td>
                        <td style={{ textAlign: 'right' }}>{t.total}</td>
                        <td style={{ textAlign: 'right', color: 'var(--s-ready)' }}>{t.delivered}</td>
                        <td style={{ textAlign: 'right', color: 'var(--s-progress)' }}>
                          {active || '—'}
                        </td>
                        <td style={{
                          textAlign: 'right',
                          color: t.delayed > 0 ? 'var(--s-delayed)' : undefined,
                        }}>
                          {t.delayed || '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {t.avg_turnaround_days !== null ? `${t.avg_turnaround_days}d` : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>{fmt(t.total_estimated)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="mini-bar-wrap" style={{ width: 80 }}>
                              <div className="mini-bar" style={{ width: `${t.completion_rate}%` }} />
                            </div>
                            <span style={{ fontSize: 12, minWidth: 30 }}>{t.completion_rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
