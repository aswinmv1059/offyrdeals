import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [vendorSales, setVendorSales] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [message, setMessage] = useState('');

  const loadAll = async () => {
    try {
      const [usersRes, salesRes, logsRes, redemptionRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/vendor-sales'),
        api.get('/admin/system-logs'),
        api.get('/admin/redemptions')
      ]);
      setUsers(usersRes.data.users || []);
      setVendorSales(salesRes.data.vendors || []);
      setSystemLogs(logsRes.data.logs || []);
      setRedemptions(redemptionRes.data.logs || []);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load admin data');
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const totals = useMemo(() => {
    const revenue = vendorSales.reduce((sum, item) => sum + Number(item.totalRevenue || 0), 0);
    const profit = vendorSales.reduce((sum, item) => sum + Number(item.profit || 0), 0);
    const sold = vendorSales.reduce((sum, item) => sum + Number(item.totalSold || 0), 0);
    return { revenue, profit, sold };
  }, [vendorSales]);

  const updateRole = async (userId, role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      setMessage(`Updated role to ${role}`);
      await loadAll();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Role update failed');
    }
  };

  const toggleBlock = async (userId, isBlocked) => {
    try {
      await api.patch(`/admin/users/${userId}/block`, { isBlocked: !isBlocked });
      setMessage(!isBlocked ? 'User blocked' : 'User unblocked');
      await loadAll();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Block update failed');
    }
  };

  const removeUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setMessage('User removed successfully');
      await loadAll();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to remove user');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 p-6 text-white shadow-2xl">
        <h1 className="text-3xl font-black">🛡 Admin Monitoring Center</h1>
        <p className="mt-2 text-sm text-slate-200">Track users, vendor product sales, profits, redemptions, and system activity.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-white/15 p-3"><p className="text-xs uppercase text-slate-200">Users</p><p className="text-2xl font-bold">{users.length}</p></div>
          <div className="rounded-2xl bg-white/15 p-3"><p className="text-xs uppercase text-slate-200">Total Vendor Sales</p><p className="text-2xl font-bold">{money(totals.revenue)}</p></div>
          <div className="rounded-2xl bg-white/15 p-3"><p className="text-xs uppercase text-slate-200">Total Profit</p><p className="text-2xl font-bold">{money(totals.profit)}</p></div>
          <div className="rounded-2xl bg-white/15 p-3"><p className="text-xs uppercase text-slate-200">Products Sold</p><p className="text-2xl font-bold">{totals.sold}</p></div>
        </div>
      </section>

      {message && <p className="rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800">{message}</p>}

      <section className="glass-card p-5">
        <h2 className="mb-4 text-xl font-bold">👥 User Management (Add/Edit/Remove)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-left">
                <th className="pb-2">ID</th>
                <th className="pb-2">Name</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Blocked</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isDefaultAdmin = user.email === 'admin';
                return (
                  <tr key={user._id} className="border-b border-slate-200">
                    <td className="py-2 font-mono text-xs">{user._id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        className="rounded border border-slate-300 bg-white p-1"
                        value={user.role}
                        onChange={(e) => updateRole(user._id, e.target.value)}
                        disabled={isDefaultAdmin}
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="VENDOR">Vendor</option>
                        <option value="USER">User</option>
                      </select>
                    </td>
                    <td>{user.isBlocked ? 'Yes' : 'No'}</td>
                    <td className="space-x-2">
                      <button
                        className="rounded-lg bg-amber-500 px-2 py-1 text-white"
                        onClick={() => toggleBlock(user._id, user.isBlocked)}
                        disabled={isDefaultAdmin}
                      >
                        {user.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        className="rounded-lg bg-rose-600 px-2 py-1 text-white"
                        onClick={() => removeUser(user._id)}
                        disabled={isDefaultAdmin}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-card p-5">
        <h2 className="mb-4 text-xl font-bold">🏬 Vendor Sales & Profit (Product-wise)</h2>
        <div className="space-y-4">
          {vendorSales.map((entry) => (
            <article key={entry.vendor.id} className="rounded-2xl border border-slate-300 bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{entry.vendor.name}</h3>
                  <p className="text-sm text-slate-600">{entry.vendor.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                  <div className="rounded bg-slate-100 px-3 py-2">Revenue: <b>{money(entry.totalRevenue)}</b></div>
                  <div className="rounded bg-slate-100 px-3 py-2">Sold: <b>{entry.totalSold}</b></div>
                  <div className="rounded bg-slate-100 px-3 py-2">Commission: <b>{money(entry.commission)}</b></div>
                  <div className="rounded bg-emerald-100 px-3 py-2">Profit: <b>{money(entry.profit)}</b></div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="pb-2">Product/Offer</th>
                      <th className="pb-2">Units Sold</th>
                      <th className="pb-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.products.map((product) => (
                      <tr key={product.offerId} className="border-b border-slate-100">
                        <td className="py-2">{product.title}</td>
                        <td>{product.sold}</td>
                        <td>{money(product.revenue)}</td>
                      </tr>
                    ))}
                    {entry.products.length === 0 && (
                      <tr>
                        <td className="py-2 text-slate-500" colSpan={3}>No product sales recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="glass-card p-5">
          <h2 className="mb-3 text-xl font-bold">🧾 Recent Redemptions</h2>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {redemptions.slice(0, 20).map((row) => (
              <div key={row._id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                <p className="font-semibold">{row.offer_id?.title || 'Offer'}</p>
                <p className="text-xs text-slate-500">Coupon: {row.coupon_id}</p>
                <p className="text-xs text-slate-500">Vendor: {row.vendor_id?.email || '-'}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-card p-5">
          <h2 className="mb-3 text-xl font-bold">📜 System Activity Logs</h2>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {systemLogs.slice(0, 30).map((log) => (
              <div key={log._id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                <p className="font-semibold">{log.action}</p>
                <p className="text-xs text-slate-500">User: {log.user_id || 'N/A'}</p>
                <p className="text-xs text-slate-500">IP: {log.ip || '-'}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
