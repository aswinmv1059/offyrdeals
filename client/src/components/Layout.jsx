import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen text-slate-900">
      <nav className="sticky top-0 z-20 border-b border-orange-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 p-4">
          <Link to="/dashboard" className="text-xl font-extrabold tracking-tight text-orange-600">OffeyrDeals ✨</Link>
          <div className="flex flex-wrap items-center gap-2">
            {user && <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold">{user.email} ({user.role})</span>}
            {user?.role === 'ADMIN' && <Link to="/admin" className="rounded-full bg-white px-3 py-1 text-sm font-medium shadow">🛡 Admin</Link>}
            {(user?.role === 'VENDOR' || user?.role === 'ADMIN') && <Link to="/vendor" className="rounded-full bg-white px-3 py-1 text-sm font-medium shadow">🏪 Vendor</Link>}
            <button onClick={logout} className="rounded-full bg-slate-900 px-3 py-1 text-sm text-white">Logout</button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl p-4 md:p-6">{children}</main>
    </div>
  );
}
