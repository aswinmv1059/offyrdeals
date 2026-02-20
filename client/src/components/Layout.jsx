import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <Link to="/dashboard" className="text-xl font-bold">OffeyrDeals</Link>
          <div className="flex items-center gap-4">
            {user && <span className="text-sm">{user.email} ({user.role})</span>}
            {user?.role === 'ADMIN' && <Link to="/admin" className="text-sm font-medium">Admin</Link>}
            {(user?.role === 'VENDOR' || user?.role === 'ADMIN') && <Link to="/vendor" className="text-sm font-medium">Vendor</Link>}
            <button onClick={logout} className="rounded bg-slate-900 px-3 py-1 text-sm text-white">Logout</button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl p-4">{children}</main>
    </div>
  );
}
