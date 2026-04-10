import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { toast, STATUSES, SectionTitle, RadioGroup, PhoneInput } from '../components/Common';
import { CheckCircle, Check, X as XIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SALUTATIONS = ['Mr', 'Mrs', 'Ms', 'Dr', 'Other'];

// ── Brands & models from Supabase via API ─────────────────────
function useAdHocOptions() {
  const [brands, setBrands] = useState([]);
  const [modelCache, setModelCache] = useState({});

  // Load all brands once on mount
  useEffect(() => {
    api.getBrands()
      .then(setBrands)
      .catch(() => toast('Failed to load brands', 'error'));
  }, []);

  // Lazy-load models per brand (cached so no repeat fetches)
  async function loadModels(brand) {
    if (!brand || modelCache[brand]) return;
    try {
      const data = await api.getModels(brand);
      setModelCache(c => ({ ...c, [brand]: data }));
    } catch {
      toast('Failed to load models', 'error');
    }
  }

  async function addBrand(name) {
    try {
      await api.addBrand(name);
      // Refresh full brand list to respect sort_order
      const updated = await api.getBrands();
      setBrands(updated);
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  async function addModel(brand, name) {
    if (!brand) return;
    try {
      await api.addModel(brand, name);
      setModelCache(c => ({ ...c, [brand]: [...(c[brand] || []), name] }));
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  function getModels(brand) {
    return brand ? (modelCache[brand] || []) : [];
  }

  return { brands, loadModels, addBrand, addModel, getModels };
}

// ── Dropdown + inline "+ Add" component ──────────────────────
function AddableSelect({ label, required, options, value, onChange, onAdd, placeholder, disabled }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  function confirm() {
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    onChange(v);
    setDraft('');
    setAdding(false);
  }

  function cancel() { setDraft(''); setAdding(false); }

  return (
    <div className="field">
      <div className="field-label-row">
        <label>{label}{required ? ' *' : ''}</label>
        {!adding && (
          <button type="button" className="add-option-btn" onClick={() => setAdding(true)}>
            + Add
          </button>
        )}
      </div>
      {adding ? (
        <div className="add-option-row">
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirm(); } if (e.key === 'Escape') cancel(); }}
            placeholder={`Type new ${label.replace(' *', '').toLowerCase()}...`}
          />
          <button type="button" className="btn-icon confirm" onClick={confirm} title="Add">
            <Check size={14} strokeWidth={2.5} />
          </button>
          <button type="button" className="btn-icon" onClick={cancel} title="Cancel">
            <XIcon size={14} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <select value={value} onChange={e => onChange(e.target.value)} required={required} disabled={disabled}>
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      )}
    </div>
  );
}

const INITIAL = {
  // Customer
  salutation: '', customer_name: '', customer_phone: '',
  alt_mobile_no: '', address: '',
  // Device
  phone_brand: '', phone_model: '', color: '',
  pattern_password: '', imei_status: '',
  // Device status
  power_status: '', touch_status: '', display_status: '', device_condition: '',
  // Complaints
  reported_issue: '', remarks: '',
  // Data backup
  data_backup: '',
  // Payment
  estimated_amount: '', advance_amount: '', confirm_estimated: false,
  // Others
  eta: '', prepared_by: '', technician: '', status: 'Pending',
};


export default function NewJobCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);
  const { brands, loadModels, addBrand, getModels, addModel } = useAdHocOptions();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.getUsers().then(setUsers).catch(() => {});
  }, []);

  // Auto-fill prepared_by with logged-in user
  useEffect(() => {
    if (user?.name) set('prepared_by', user.name);
  }, [user]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Pre-fetch models whenever brand changes
  useEffect(() => { loadModels(form.phone_brand); }, [form.phone_brand]);

  async function submit(e) {
    e.preventDefault();
    if (!form.customer_name || !form.phone_brand || !form.phone_model || !form.reported_issue) {
      toast('Please fill all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const data = await api.createJobCard(form);
      setCreated(data);
      toast(`Job card ${data.job_card_id} created!`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    return (
      <div className="page" style={{ maxWidth: 480 }}>
        <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
          <div style={{ marginBottom: 16, color: 'var(--s-ready)', display: 'flex', justifyContent: 'center' }}>
            <CheckCircle size={48} strokeWidth={1.5} />
          </div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Job Card Created
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 24, color: 'var(--accent)', marginBottom: 6 }}>
            {created.job_card_id}
          </div>
          <div style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 28 }}>
            {created.phone_brand} {created.phone_model} · {created.customer_name}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={() => { setCreated(null); setForm(INITIAL); }}>
              + New Card
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/jobs')}>
              View All Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">New Job Card</div>
        <div className="page-subtitle">Create a repair record for incoming device</div>
      </div>

      <form onSubmit={submit}>

        {/* ── 2-column section grid ── */}
        <div className="form-section-grid">

          {/* ── LEFT column ── */}
          <div className="form-section-col">

            {/* Customer Information */}
            <div className="card">
              <SectionTitle>Customer Information</SectionTitle>
              <div className="form-grid">
                <div className="field">
                  <label>Salutation</label>
                  <select value={form.salutation} onChange={e => set('salutation', e.target.value)}>
                    <option value="">Select</option>
                    {SALUTATIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Customer Name *</label>
                  <input value={form.customer_name} onChange={e => set('customer_name', e.target.value)} placeholder="Full name" required />
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
                  <textarea value={form.address} onChange={e => set('address', e.target.value)} placeholder="Customer address..." style={{ minHeight: 64 }} />
                </div>
              </div>
            </div>

            {/* Device Status When Received */}
            <div className="card">
              <SectionTitle>Device Status When Received</SectionTitle>
              <div className="form-grid">
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
                  <textarea value={form.device_condition} onChange={e => set('device_condition', e.target.value)} placeholder="Describe physical condition when received (scratches, cracks, etc.)..." style={{ minHeight: 70 }} />
                </div>
              </div>
            </div>

            {/* Data Backup */}
            <div className="card">
              <SectionTitle>Data Backup</SectionTitle>
              <RadioGroup options={['No Need', 'Important']} value={form.data_backup} onChange={v => set('data_backup', v)} />
            </div>

          </div>

          {/* ── RIGHT column ── */}
          <div className="form-section-col">

            {/* Device Information */}
            <div className="card">
              <SectionTitle>Device Information</SectionTitle>
              <div className="form-grid">
                <AddableSelect
                  label="Brand" required
                  options={brands}
                  value={form.phone_brand}
                  onChange={v => { set('phone_brand', v); set('phone_model', ''); }}
                  onAdd={addBrand}
                  placeholder="Select brand"
                />
                <AddableSelect
                  label="Model" required
                  options={getModels(form.phone_brand)}
                  value={form.phone_model}
                  onChange={v => set('phone_model', v)}
                  onAdd={m => addModel(form.phone_brand, m)}
                  placeholder={form.phone_brand ? 'Select model' : 'Select brand first'}
                  disabled={!form.phone_brand}
                />
                <div className="field">
                  <label>Color</label>
                  <input value={form.color} onChange={e => set('color', e.target.value)} placeholder="e.g. Midnight Black" />
                </div>
                <div className="field">
                  <label>Pattern / Password</label>
                  <input value={form.pattern_password} onChange={e => set('pattern_password', e.target.value)} placeholder="Lock screen code" />
                </div>
                <div className="field span2">
                  <RadioGroup label="IMEI" options={['Yes', 'No', "Can't Read"]} value={form.imei_status} onChange={v => set('imei_status', v)} />
                </div>
              </div>
            </div>

            {/* Complaints */}
            <div className="card">
              <SectionTitle>Complaints</SectionTitle>
              <div className="form-grid">
                <div className="field span2">
                  <label>Complaints *</label>
                  <textarea value={form.reported_issue} onChange={e => set('reported_issue', e.target.value)} placeholder="Describe the problem reported by the customer..." required />
                </div>
                <div className="field span2">
                  <label>Remarks / Narration</label>
                  <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Internal notes or additional narration..." style={{ minHeight: 70 }} />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="card">
              <SectionTitle>Payment</SectionTitle>
              <div className="form-grid">
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
              </div>
            </div>

          </div>
        </div>

        {/* ── Others — full width ── */}
        <div className="card" style={{ marginTop: 16 }}>
          <SectionTitle>Others</SectionTitle>
          <div className="form-grid form-grid-4">
            <div className="field">
              <label>Expected Delivery Date</label>
              <input type="date" value={form.eta} onChange={e => set('eta', e.target.value)} min={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="field">
              <label>Prepared By</label>
              <input value={form.prepared_by} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
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
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16, marginBottom: 32 }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create Job Card'}
          </button>
        </div>

      </form>
    </div>
  );
}
