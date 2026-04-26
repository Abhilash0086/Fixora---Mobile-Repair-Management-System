import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Loading, toast, ConfirmModal } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { Trash2 } from 'lucide-react';

const INITIAL = { name: '', email: '', password: '', role: 'technician' };

export default function Users() {
  const { user: me } = useAuth();
  const callerRole = me?.role;

  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState(INITIAL);
  const [saving, setSaving]   = useState(false);
  const [confirm, setConfirm] = useState(null); // { id, name }

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast('All fields are required', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.createUser(form);
      toast(`User ${form.name} created`);
      setForm(INITIAL);
      await load();
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
      await api.deleteUser(id);
      toast(`${name} deleted`);
      await load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  // Which roles can the caller create?
  const creatableRoles = callerRole === 'owner'
    ? ['technician', 'admin', 'owner']
    : ['technician'];

  // Can the caller delete a given user row?
  function canDelete(u) {
    if (u.id === me?.id)      return false; // no self-delete
    if (u.role === 'owner')   return false; // owner is indestructible
    if (callerRole === 'admin' && u.role !== 'technician') return false;
    return true;
  }

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="page-header">
        <div className="page-title">Users</div>
        <div className="page-subtitle">Manage team accounts</div>
      </div>

      {/* Add user form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="form-section-title">Add New User</div>
        <form onSubmit={submit}>
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label>Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" />
            </div>
            <div className="field">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="field">
              <label>Password *</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div className="field">
              <label>Role</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}>
                {creatableRoles.map(r => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      {/* Users list */}
      <div className="table-wrap">
        {loading ? <Loading /> : users.length === 0 ? (
          <div className="empty">
            <div className="empty-text">No users yet</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    {u.name}
                    {u.id === me?.id && (
                      <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 6 }}>(you)</span>
                    )}
                  </td>
                  <td><span className={`role-chip role-${u.role}`}>{u.role}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    {canDelete(u) && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--s-returned)' }}
                        onClick={() => setConfirm({ id: u.id, name: u.name })}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirm && (
        <ConfirmModal
          title="Delete User"
          message={`Remove "${confirm.name}" from the team?`}
          detail="This will permanently delete their account and they will no longer be able to sign in."
          confirmLabel="Delete"
          confirmClass="btn-danger"
          onConfirm={confirmDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
