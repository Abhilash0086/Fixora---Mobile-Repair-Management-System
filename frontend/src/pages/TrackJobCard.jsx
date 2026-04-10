import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { CheckCircle2, Clock, Wrench, PackageCheck, RotateCcw, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

const STATUS_CONFIG = {
  'Pending':            { icon: Clock,         color: '#a16207', bg: '#fef9c3', label: 'Pending'            },
  'In Progress':        { icon: Wrench,        color: '#1d4ed8', bg: '#dbeafe', label: 'In Progress'        },
  'Ready for Delivery': { icon: PackageCheck,  color: '#15803d', bg: '#dcfce7', label: 'Ready for Delivery' },
  'Delivered':          { icon: CheckCircle2,  color: '#6d28d9', bg: '#ede9fe', label: 'Delivered'          },
  'Returned':           { icon: RotateCcw,     color: '#dc2626', bg: '#fee2e2', label: 'Returned'           },
  'Delayed':            { icon: AlertTriangle, color: '#c2410c', bg: '#ffedd5', label: 'Delayed'            },
  'Cancelled':          { icon: XCircle,       color: '#4b5563', bg: '#f3f4f6', label: 'Cancelled'          },
};

const STATUS_ORDER = ['Pending', 'In Progress', 'Ready for Delivery', 'Delivered'];

function fmtDate(str) {
  if (!str) return null;
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(str) {
  if (!str) return null;
  return new Date(str).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TrackJobCard() {
  const { id } = useParams();
  const [job,     setJob]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    api.trackJobCard(id)
      .then(setJob)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="track-page">
      {/* ── Brand header ── */}
      <div className="track-header">
        <div className="track-brand">Fixora</div>
        <div className="track-brand-sub">Repair Status Tracker</div>
      </div>

      <div className="track-body">
        {loading && (
          <div className="track-loading">
            <Loader2 size={32} strokeWidth={1.5} className="track-spinner" />
            <div>Looking up job card…</div>
          </div>
        )}

        {error && (
          <div className="track-error-card">
            <div className="track-error-icon"><XCircle size={40} strokeWidth={1.5} /></div>
            <div className="track-error-title">Job card not found</div>
            <div className="track-error-sub">
              Please check the job card ID and try again, or contact the shop directly.
            </div>
          </div>
        )}

        {job && !loading && (() => {
          const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG['Pending'];
          const StatusIcon = cfg.icon;
          const isSpecial = ['Returned', 'Cancelled', 'Delayed'].includes(job.status);

          return (
            <>
              {/* ── Job ID + Device ── */}
              <div className="track-card track-id-card">
                <div className="track-job-id">{job.job_card_id}</div>
                <div className="track-device">{job.phone_brand} {job.phone_model}</div>
                {job.color && <div className="track-color">{job.color}</div>}
              </div>

              {/* ── Current Status ── */}
              <div className="track-card track-status-card"
                style={{ borderColor: cfg.color, background: `${cfg.bg}22` }}>
                <div className="track-status-icon" style={{ background: cfg.bg, color: cfg.color }}>
                  <StatusIcon size={28} strokeWidth={1.75} />
                </div>
                <div>
                  <div className="track-status-label">Current Status</div>
                  <div className="track-status-value" style={{ color: cfg.color }}>{job.status}</div>
                  {job.status === 'Ready for Delivery' && (
                    <div className="track-status-msg">
                      Your device is ready! Please visit us to collect it.
                    </div>
                  )}
                  {job.status === 'Delivered' && (
                    <div className="track-status-msg">
                      Device delivered on {fmtDate(job.delivered_at)}. Thank you!
                    </div>
                  )}
                  {job.status === 'Delayed' && (
                    <div className="track-status-msg" style={{ color: cfg.color }}>
                      Repair is taking longer than expected. We'll update you soon.
                    </div>
                  )}
                </div>
              </div>

              {/* ── Progress bar (for normal flow only) ── */}
              {!isSpecial && (
                <div className="track-card track-progress-card">
                  <div className="track-progress-label">Repair Progress</div>
                  <div className="track-progress-steps">
                    {STATUS_ORDER.map((s, i) => {
                      const stepCfg   = STATUS_CONFIG[s];
                      const StepIcon  = stepCfg.icon;
                      const current   = job.status === s;
                      const completed = STATUS_ORDER.indexOf(job.status) > i;
                      return (
                        <div key={s} className="track-step">
                          <div className={`track-step-circle ${completed ? 'done' : current ? 'active' : ''}`}>
                            <StepIcon size={14} strokeWidth={2} />
                          </div>
                          <div className={`track-step-label ${current ? 'active' : ''}`}>{s}</div>
                          {i < STATUS_ORDER.length - 1 && (
                            <div className={`track-step-line ${completed ? 'done' : ''}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Details ── */}
              <div className="track-card">
                <div className="track-section-title">Repair Details</div>
                <div className="track-detail-grid">
                  <div className="track-detail-item">
                    <div className="track-detail-label">Reported Issue</div>
                    <div className="track-detail-value">{job.reported_issue}</div>
                  </div>
                  {job.eta && (
                    <div className="track-detail-item">
                      <div className="track-detail-label">Expected Completion</div>
                      <div className="track-detail-value">{fmtDate(job.eta)}</div>
                    </div>
                  )}
                  {job.technician && (
                    <div className="track-detail-item">
                      <div className="track-detail-label">Assigned Technician</div>
                      <div className="track-detail-value">{job.technician}</div>
                    </div>
                  )}
                  <div className="track-detail-item">
                    <div className="track-detail-label">Job Received On</div>
                    <div className="track-detail-value">{fmtDate(job.created_at)}</div>
                  </div>
                </div>
                {job.remarks && (
                  <div className="track-remarks">
                    <div className="track-detail-label" style={{ marginBottom: 6 }}>Notes from Technician</div>
                    <div className="track-remarks-text">{job.remarks}</div>
                  </div>
                )}
              </div>

              {/* ── Status Timeline ── */}
              {job.status_timeline?.length > 0 && (
                <div className="track-card">
                  <div className="track-section-title">Status History</div>
                  <div className="track-timeline">
                    {[...job.status_timeline].reverse().map((entry, i) => {
                      const entryCfg = STATUS_CONFIG[entry.new_status] || {};
                      return (
                        <div key={i} className="track-timeline-entry">
                          <div className="track-timeline-dot"
                            style={{ background: entryCfg.color || 'var(--accent)' }} />
                          <div className="track-timeline-content">
                            <div className="track-timeline-status">{entry.new_status}</div>
                            {entry.notes && (
                              <div className="track-timeline-note">{entry.notes}</div>
                            )}
                            <div className="track-timeline-time">{fmtDateTime(entry.changed_at)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Footer ── */}
              <div className="track-footer">
                <div className="track-footer-brand">Fixora</div>
                <div className="track-footer-text">
                  Questions about your repair? Contact us with your job card ID.
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
