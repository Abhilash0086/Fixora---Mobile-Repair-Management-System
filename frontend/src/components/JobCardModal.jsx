import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Badge, Loading, STATUSES, SectionTitle, RadioGroup, PhoneInput,
  fmtDate, fmtDateTime, toast,
} from './Common';

const BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'Realme', 'OPPO', 'Vivo', 'OnePlus', 'Motorola', 'Nokia', 'Other'];
const SALUTATIONS = ['Mr', 'Mrs', 'Ms', 'Dr', 'Other'];

const FIELD_LABELS = {
  salutation: 'Salutation', customer_name: 'Customer Name',
  customer_phone: 'Mobile No', alt_mobile_no: 'Alt Mobile No', address: 'Address',
  phone_brand: 'Brand', phone_model: 'Model', color: 'Color',
  pattern_password: 'Pattern/Password', imei_status: 'IMEI',
  power_status: 'Power', touch_status: 'Touch', display_status: 'Display',
  device_condition: 'Device Condition', reported_issue: 'Complaints',
  remarks: 'Remarks', data_backup: 'Data Backup',
  estimated_amount: 'Estimated Amount', advance_amount: 'Advance Amount',
  confirm_estimated: 'Confirm Estimated', prepared_by: 'Prepared By',
  technician: 'Technician', eta: 'ETA',
};

function fmtCurrency(val) {
  if (val === null || val === undefined || val === '') return '—';
  return `₹${parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

// ── Read-only detail row helpers ──────────────────────────────
function DetailSection({ title, children }) {
  return (
    <div className="modal-detail-section">
      <div className="modal-section-label">{title}</div>
      <div className="detail-grid">{children}</div>
    </div>
  );
}

function DI({ label, value, full }) {
  return (
    <div className="detail-item" style={full ? { gridColumn: 'span 2' } : {}}>
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value || '—'}</div>
    </div>
  );
}

function DIChip({ label, value }) {
  return (
    <div className="detail-item">
      <div className="detail-label">{label}</div>
      <div className="detail-value">
        {value ? <span className="detail-chip">{value}</span> : '—'}
      </div>
    </div>
  );
}

// ── Edit form section wrapper ─────────────────────────────────
function EditSection({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <SectionTitle>{title}</SectionTitle>
      <div className="form-grid">{children}</div>
    </div>
  );
}

export function JobCardModal({ jobCardId, onClose, onUpdated }) {
  const { user } = useAuth();
  const isTech = user?.role === 'technician';
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [form, setForm] = useState({});
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.getUsers().then(setUsers).catch(() => {});
  }, []);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [jobCardId]);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getJobCard(jobCardId);
      setCard(data);
      setForm({
        // Customer
        salutation:        data.salutation        || '',
        customer_name:     data.customer_name     || '',
        customer_phone:    data.customer_phone    || '',
        alt_mobile_no:     data.alt_mobile_no     || '',
        address:           data.address           || '',
        // Device
        phone_brand:       data.phone_brand       || '',
        phone_model:       data.phone_model       || '',
        color:             data.color             || '',
        pattern_password:  data.pattern_password  || '',
        imei_status:       data.imei_status       || '',
        // Device status
        power_status:      data.power_status      || '',
        touch_status:      data.touch_status      || '',
        display_status:    data.display_status    || '',
        device_condition:  data.device_condition  || '',
        // Complaints
        reported_issue:    data.reported_issue    || '',
        remarks:           data.remarks           || '',
        // Data backup
        data_backup:       data.data_backup       || '',
        // Payment
        estimated_amount:  data.estimated_amount  ?? '',
        advance_amount:    data.advance_amount    ?? '',
        confirm_estimated: data.confirm_estimated ?? false,
        // Others
        prepared_by:       data.prepared_by       || '',
        technician:        data.technician        || '',
        eta:               data.eta               || '',
        status:            data.status            || 'Pending',
      });
    } catch {
      toast('Failed to load job card', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await api.updateJobCard(jobCardId, form);
      toast('Job card updated');
      setEditing(false);
      await load();
      onUpdated?.();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function quickStatus(status) {
    if (statusSaving || card?.status === status) return;
    setStatusSaving(true);
    try {
      await api.updateJobCard(jobCardId, { status });
      toast('Status updated');
      await load();
      onUpdated?.();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setStatusSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">

        {/* ── Header ── */}
        <div className="modal-header">
          <div>
            <div className="modal-title">{card?.job_card_id || '...'}</div>
            {card && <div style={{ marginTop: 4 }}><Badge status={card.status} /></div>}
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} strokeWidth={2} /></button>
        </div>

        {/* ── Body ── */}
        <div className="modal-body">
          {loading ? <Loading /> : editing ? (

            /* ════════════════ EDIT MODE ════════════════ */
            <>
              <EditSection title="Customer Information">
                <div className="field">
                  <label>Salutation</label>
                  <select value={form.salutation} onChange={e => set('salutation', e.target.value)}>
                    <option value="">Select</option>
                    {SALUTATIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Customer Name</label>
                  <input value={form.customer_name} onChange={e => set('customer_name', e.target.value)} />
                </div>
                <div className="field">
                  <label>Mobile No</label>
                  <PhoneInput value={form.customer_phone} onChange={v => set('customer_phone', v)} placeholder="XXXXX XXXXX" />
                </div>
                <div className="field">
                  <label>Alternative Mobile No</label>
                  <PhoneInput value={form.alt_mobile_no} onChange={v => set('alt_mobile_no', v)} placeholder="XXXXX XXXXX" />
                </div>
                <div className="field span2">
                  <label>Address</label>
                  <textarea value={form.address} onChange={e => set('address', e.target.value)} style={{ minHeight: 60 }} />
                </div>
              </EditSection>

              <EditSection title="Device Information">
                <div className="field">
                  <label>Brand</label>
                  <select value={form.phone_brand} onChange={e => set('phone_brand', e.target.value)}>
                    <option value="">Select brand</option>
                    {BRANDS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Model</label>
                  <input value={form.phone_model} onChange={e => set('phone_model', e.target.value)} />
                </div>
                <div className="field">
                  <label>Color</label>
                  <input value={form.color} onChange={e => set('color', e.target.value)} />
                </div>
                <div className="field">
                  <label>Pattern / Password</label>
                  <input value={form.pattern_password} onChange={e => set('pattern_password', e.target.value)} />
                </div>
                <div className="field span2">
                  <RadioGroup
                    label="IMEI"
                    options={['Yes', 'No', "Can't Read"]}
                    value={form.imei_status}
                    onChange={v => set('imei_status', v)}
                  />
                </div>
              </EditSection>

              <EditSection title="Device Status When Received">
                <div className="field span2">
                  <RadioGroup label="Power" options={['Power On', 'No Power']} value={form.power_status} onChange={v => set('power_status', v)} />
                </div>
                <div className="field span2">
                  <RadioGroup label="Touch" options={['Working', 'Not Working', "Can't Check"]} value={form.touch_status} onChange={v => set('touch_status', v)} />
                </div>
                <div className="field span2">
                  <RadioGroup label="Display" options={['Working', 'Not Working', "Can't Check"]} value={form.display_status} onChange={v => set('display_status', v)} />
                </div>
                <div className="field span2">
                  <label>Device Condition</label>
                  <textarea value={form.device_condition} onChange={e => set('device_condition', e.target.value)} style={{ minHeight: 64 }} />
                </div>
              </EditSection>

              <EditSection title="Complaints">
                <div className="field span2">
                  <label>Complaints</label>
                  <textarea value={form.reported_issue} onChange={e => set('reported_issue', e.target.value)} />
                </div>
                <div className="field span2">
                  <label>Remarks / Narration</label>
                  <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)} style={{ minHeight: 64 }} />
                </div>
              </EditSection>

              <EditSection title="Data Backup">
                <div className="field span2">
                  <RadioGroup options={['No Need', 'Important']} value={form.data_backup} onChange={v => set('data_backup', v)} />
                </div>
              </EditSection>

              <EditSection title="Payment">
                <div className="field">
                  <label>Estimated Amount (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.estimated_amount} onChange={e => set('estimated_amount', e.target.value)} placeholder="0.00" />
                </div>
                <div className="field">
                  <label>Advance Amount (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.advance_amount} onChange={e => set('advance_amount', e.target.value)} placeholder="0.00" />
                </div>
                <div className="field span2">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={form.confirm_estimated} onChange={e => set('confirm_estimated', e.target.checked)} />
                    Confirmed estimated amount with customer
                  </label>
                </div>
              </EditSection>

              <EditSection title="Others">
                <div className="field">
                  <label>Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Technician</label>
                  <select value={form.technician} onChange={e => set('technician', e.target.value)}>
                    <option value="">Assign technician</option>
                    {users.filter(u => u.role === 'technician').map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Prepared By</label>
                  <input value={form.prepared_by} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
                <div className="field">
                  <label>Expected Delivery Date</label>
                  <input type="date" value={form.eta} onChange={e => set('eta', e.target.value)} />
                </div>
              </EditSection>
            </>

          ) : (

            /* ════════════════ VIEW MODE ════════════════ */
            <>
              {/* Quick Status — technician only */}
              {isTech && (
                <div className="quick-status-wrap">
                  <div className="quick-status-label">Update Status</div>
                  <div className="quick-status-grid">
                    {STATUSES.map(s => (
                      <button
                        key={s}
                        className={`quick-status-btn${card.status === s ? ' qs-active' : ''}`}
                        onClick={() => quickStatus(s)}
                        disabled={statusSaving}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <DetailSection title="Customer Information">
                <DI label="Salutation" value={card.salutation} />
                <DI label="Customer Name" value={card.customer_name} />
                <DI label="Mobile No" value={card.customer_phone} />
                <DI label="Alternative Mobile" value={card.alt_mobile_no} />
                <DI label="Address" value={card.address} full />
              </DetailSection>

              <DetailSection title="Device Information">
                <DI label="Brand" value={card.phone_brand} />
                <DI label="Model" value={card.phone_model} />
                <DI label="Color" value={card.color} />
                <DI label="Pattern / Password" value={card.pattern_password} />
                <DIChip label="IMEI" value={card.imei_status} />
              </DetailSection>

              <DetailSection title="Device Status When Received">
                <DIChip label="Power" value={card.power_status} />
                <DIChip label="Touch" value={card.touch_status} />
                <DIChip label="Display" value={card.display_status} />
                <DI label="Device Condition" value={card.device_condition} full />
              </DetailSection>

              <DetailSection title="Complaints">
                <DI label="Complaints" value={card.reported_issue} full />
                <DI label="Remarks / Narration" value={card.remarks} full />
              </DetailSection>

              <DetailSection title="Data Backup &amp; Payment">
                <DIChip label="Data Backup" value={card.data_backup} />
                <div className="detail-item">
                  <div className="detail-label">Estimated Amount</div>
                  <div className="detail-value">{fmtCurrency(card.estimated_amount)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Advance Amount</div>
                  <div className="detail-value">{fmtCurrency(card.advance_amount)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Estimate Confirmed</div>
                  <div className="detail-value">{card.confirm_estimated ? 'Yes' : 'No'}</div>
                </div>
              </DetailSection>

              <DetailSection title="Others">
                <DI label="Technician" value={card.technician} />
                <DI label="Prepared By" value={card.prepared_by} />
                <DI label="Expected Delivery" value={fmtDate(card.eta)} />
                <DI label="Created" value={fmtDateTime(card.created_at)} />
                {card.delivered_at && (
                  <DI label="Delivered On" value={fmtDateTime(card.delivered_at)} />
                )}
              </DetailSection>

              {/* Activity Log */}
              {card.activity_log?.length > 0 && (
                <div className="status-log">
                  <div className="log-title">Activity Log</div>
                  {card.activity_log.map((log, i) => (
                    <div key={log.id ?? i} className="log-item">
                      <div className={`log-dot${log.type === 'edit' ? ' log-dot-edit' : ''}`} />
                      <div>
                        <div className="log-text">
                          {log.type === 'status'
                            ? (log.old_status ? `${log.old_status} → ${log.new_status}` : log.new_status) + (log.notes ? ` · ${log.notes}` : '')
                            : `${FIELD_LABELS[log.field_name] ?? log.field_name}: ${log.old_value ?? '—'} → ${log.new_value ?? '—'}`
                          }
                        </div>
                        <div className="log-time">{fmtDateTime(log.changed_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="modal-footer">
          {editing ? (
            <>
              <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={onClose}>Close</button>
              {!isTech && (
                <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit</button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
