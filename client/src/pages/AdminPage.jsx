import { useEffect, useState } from 'react';
import api from '../api/client';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState('');

  const load = async () => {
    const [u, o, r] = await Promise.all([
      api.get('/admin/users'),
      api.get('/admin/offers'),
      api.get('/admin/redemptions')
    ]);
    setUsers(u.data.users || []);
    setOffers(o.data.offers || []);
    setLogs(r.data.logs || []);
  };

  useEffect(() => {
    load();
  }, []);

  const updateRole = async (userId, role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      setMessage('Role updated');
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Role update failed');
    }
  };

  const approveVendor = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/approve-vendor`);
      setMessage('Vendor approved');
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Vendor approval failed');
    }
  };

  const toggleBlock = async (userId, isBlocked) => {
    try {
      await api.patch(`/admin/users/${userId}/block`, { isBlocked: !isBlocked });
      setMessage('User block status updated');
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'User block update failed');
    }
  };

  const exportCsv = async () => {
    const response = await api.get('/admin/export/csv', { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'redemptions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="rounded bg-white p-4 shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button onClick={exportCsv} className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Export CSV</button>
        </div>
        {message && <p className="mt-3 text-sm">{message}</p>}
      </section>

      <section className="rounded bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold">Users</h2>
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user._id} className="flex flex-wrap items-center gap-2 border-b pb-2 text-sm">
              <span className="font-medium">{user.email}</span>
              <span>({user.role})</span>
              <select className="rounded border p-1" value={user.role} onChange={(e) => updateRole(user._id, e.target.value)}>
                <option value="USER">USER</option>
                <option value="VENDOR">VENDOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              {user.role === 'VENDOR' && !user.isVendorApproved && (
                <button className="rounded bg-emerald-600 px-2 py-1 text-white" onClick={() => approveVendor(user._id)}>Approve Vendor</button>
              )}
              <button className="rounded bg-red-700 px-2 py-1 text-white" onClick={() => toggleBlock(user._id, user.isBlocked)}>
                {user.isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold">All Offers</h2>
        <div className="space-y-2 text-sm">
          {offers.map((offer) => (
            <div key={offer._id} className="border-b pb-2">
              {offer.title} - {offer.category} - {offer.vendor_id?.email}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold">Redemption Logs</h2>
        <div className="space-y-2 text-sm">
          {logs.map((log) => (
            <div key={log._id} className="border-b pb-2">
              {log.coupon_id} | {log.user_id?.email} | {log.vendor_id?.email} | {new Date(log.redeemed_at).toLocaleString()}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
