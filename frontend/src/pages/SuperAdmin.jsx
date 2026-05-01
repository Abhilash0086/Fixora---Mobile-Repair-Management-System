import { useState, useEffect } from 'react';
import { Lock, Trash2, Eye, EyeOff, Building2 } from 'lucide-react';
import { api } from '../lib/api';
import { toast, ToastArea, ConfirmModal, Loading } from '../components/Common';

const SESSION_KEY = 'fx_admin_key';

function slugify(str) {
  return str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

const ORG_INIT = {
  org_name: '', org_slug: '',
  owner_name: '', owner_email: '', owner_password: '',
};

export default function SuperAdmin() {
  const [adminKey, setAdminKey]   = useState(() => sessionStorage.getItem(SESSION_KEY) || '');
  const [keyInput, setKeyInput]   = useState('');
  const [showKey, setShowKey]     = useState(false);
  const [unlocked, setUnlocked]   = useState(!!sessionStorage.getItem(SESSION_KEY));

  const [orgs, setOrgs]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [keyError, setKeyError]   = useState('');
  const [form, setForm]           = useState(ORG_INIT);
  const [saving, setSaving]       = useState(false);
  const [confirm, setConfirm]     = useState(null); // { id, name }

  // Apply saved theme
  useEffect(() => {
    const t = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  useEffect(() => {
    if (unlocked) loadOrgs();
  }, [unlocked]);

  async function loadOrgs() {
    setLoading(true);
    try {
      const data = await api.listOrgs(adminKey);
      setOrgs(data);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlock(e) {
    e.preventDefault();
    const k = keyInput.trim();
    if (!k) return;
    setUnlocking(true);
    setKeyError('');
    try {
      // Verify the key works before unlocking
      const data = await api.listOrgs(k);
      sessionStorage.setItem(SESSION_KEY, k);
      setAdminKey(k);
      setOrgs(data);
      setUnlocked(true);
    } catch (err) {
      setKeyError('Incorrect key. Please try again.');
    } finally {
      setUnlocking(false);
    }
  }

  function handleLock() {
    sessionStorage.removeItem(SESSION_KEY);
    setAdminKey('');
    setKeyInput('');
    setUnlocked(false);
    setOrgs([]);
  }

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function createOrg(e) {
    e.preventDefault();
    const { org_name, org_slug, owner_name, owner_email, owner_password } = form;
    if (!org_name || !org_slug || !owner_name || !owner_email || !owner_password) {
      toast('All fields are required', 'error'); return;
    }
    setSaving(true);
    try {
      await api.createOrg(adminKey, form);
      toast(`"${org_name}" created`);
      setForm(ORG_INIT);
      await loadOrgs();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    const { id, name } = confirm;
    setConfirm(null);
    try {
      await api.deleteOrg(adminKey, id);
      toast(`${name} deleted`);
      await loadOrgs();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  // ── Locked screen ──────────────────────────────────────────
  if (!unlocked) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg)', padding: 24,
      }}>
        <div className="card" style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 48, height: 48, borderRadius: 12,
              background: 'rgba(249,115,22,0.12)', marginBottom: 12,
            }}>
              <Lock size={22} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700 }}>
              Super Admin
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
              Enter your admin key to continue
            </div>
          </div>
          <form onSubmit={handleUnlock}>
            <div className="field" style={{ position: 'relative' }}>
              <label>Admin Key</label>
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={e => { setKeyInput(e.target.value); setKeyError(''); }}
                placeholder="••••••••••••••••"
                autoFocus
                style={{ paddingRight: 40, borderColor: keyError ? 'var(--s-returned)' : undefined }}
              />
              <button
                type="button"
                onClick={() => setShowKey(s => !s)}
                style={{
                  position: 'absolute', right: 10, top: 34,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-3)', padding: 4,
                }}
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {keyError && (
              <div style={{ fontSize: 12, color: 'var(--s-returned)', marginTop: 4 }}>
                {keyError}
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} disabled={unlocking}>
              {unlocking ? 'Verifying…' : 'Unlock'}
            </button>
          </form>
        </div>
        <ToastArea />
      </div>
    );
  }

  // ── Unlocked screen ────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={22} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700 }}>
                Super Admin
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>
                Organisation management
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLock}>
            <Lock size={13} /> Lock
          </button>
        </div>

        {/* Create org form */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="form-section-title">New Organisation</div>
          <form onSubmit={createOrg}>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="field">
                <label>Organisation Name *</label>
                <input
                  value={form.org_name}
                  onChange={e => {
                    setF('org_name', e.target.value);
                    setF('org_slug', slugify(e.target.value));
                  }}
                  placeholder="ABC Mobile Repairs"
                />
              </div>
              <div className="field">
                <label>Slug *</label>
                <input
                  value={form.org_slug}
                  onChange={e => setF('org_slug', slugify(e.target.value))}
                  placeholder="abc-mobile-repairs"
                />
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                  Auto-generated · lowercase letters, numbers and hyphens only
                </div>
              </div>
              <div className="field">
                <label>Owner Name *</label>
                <input
                  value={form.owner_name}
                  onChange={e => setF('owner_name', e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="field">
                <label>Owner Email *</label>
                <input
                  type="email"
                  value={form.owner_email}
                  onChange={e => setF('owner_email', e.target.value)}
                  placeholder="owner@shop.com"
                />
              </div>
              <div className="field span2">
                <label>Owner Password *</label>
                <input
                  type="password"
                  value={form.owner_password}
                  onChange={e => setF('owner_password', e.target.value)}
                  placeholder="Min 6 characters"
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating…' : '+ Create Organisation'}
              </button>
            </div>
          </form>
        </div>

        {/* Orgs list */}
        <div className="card">
          <div className="form-section-title" style={{ marginBottom: 16 }}>
            All Organisations
            <span style={{ fontWeight: 400, color: 'var(--text-3)', marginLeft: 8 }}>
              ({orgs.length})
            </span>
          </div>
          <div className="table-wrap" style={{ margin: 0 }}>
            {loading ? <Loading /> : orgs.length === 0 ? (
              <div className="empty"><div className="empty-text">No organisations yet</div></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 500 }}>{o.name}</td>
                      <td>
                        <code style={{ fontSize: 12, color: 'var(--text-3)' }}>{o.slug}</code>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {new Date(o.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--s-returned)' }}
                          onClick={() => setConfirm({ id: o.id, name: o.name })}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {confirm && (
        <ConfirmModal
          title="Delete Organisation"
          message={`Delete "${confirm.name}" and all its data?`}
          detail="This permanently removes all users, job cards and enquiries for this organisation. This cannot be undone."
          confirmLabel="Delete Organisation"
          confirmClass="btn-danger"
          onConfirm={confirmDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      <ToastArea />
    </div>
  );
}
