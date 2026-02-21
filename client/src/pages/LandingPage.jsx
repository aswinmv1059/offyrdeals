import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const categories = [
  ['⌚', 'Fashion & Lifestyle'],
  ['🍽', 'Food & Beverages'],
  ['✈', 'Travel & Tourism'],
  ['🚗', 'Vehicle & Accessories'],
  ['🖥', 'Home Care & Appliances'],
  ['🧪', 'Medical Care & Pharmaceuticals'],
  ['🧘', 'Fitness & Wellness'],
  ['🚚', 'Transportation & Logistics'],
  ['👕', 'Kids Fashion & Entertainments'],
  ['⭐', 'Best Selling Products']
];

export default function LandingPage() {
  const { user } = useAuth();
  const logoSrc = `${import.meta.env.BASE_URL}offeyr-logo-mark.svg`;

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <div className="bg-[#61b63f] px-4 py-2 text-right text-sm font-semibold text-white">
        You can contact us 24/7 <span className="ml-2 text-yellow-200">+91 96339 56500</span>
      </div>

      <header className="liquid-glass sticky top-0 z-20 border-b border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-7">
          <img src={logoSrc} alt="Offyr" className="smooth-rise h-14 w-auto" />
          <div className="flex items-center gap-6 text-slate-700">
            {user ? (
              <Link to="/dashboard" className="flex items-center gap-2 font-semibold hover:text-lime-600">
                <span className="text-xl">👤</span>
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <Link to="/login" className="flex items-center gap-2 font-semibold hover:text-lime-600">
                <span className="text-xl">👤</span>
                <span>
                  <span className="block text-xs font-normal text-slate-500">Sign In</span>
                  <span>Account</span>
                </span>
              </Link>
            )}
            <button className="smooth-rise relative text-2xl text-slate-700">
              ♡
              <span className="absolute -right-2 -top-1 rounded-full bg-rose-500 px-1 text-[10px] text-white">0</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[380px_1fr]">
        <aside className="liquid-glass rounded-xl border border-slate-200 bg-white/70">
          {categories.map(([icon, cat], idx) => (
            <button key={cat} className={`smooth-rise flex w-full items-center justify-between px-5 py-4 text-left font-medium text-slate-700 hover:bg-lime-50 ${idx !== categories.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <span className="flex items-center gap-3 text-[16px]">
                <span className="text-[20px]">{icon}</span>
                <span>{cat}</span>
              </span>
              <span>›</span>
            </button>
          ))}
        </aside>

        <section className="liquid-glass relative overflow-hidden rounded-xl bg-[#c8b3ff] p-8 shadow">
          <img
            src="https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80"
            alt="Deals hero"
            className="absolute inset-0 h-full w-full object-cover object-right opacity-35"
          />
          <div className="relative max-w-xl">
            <div className="mb-5 inline-flex items-center gap-3 rounded-full bg-white/70 px-4 py-2 text-lg font-semibold text-slate-700">
              <span>Exclusive Offer</span>
              <span className="rounded bg-rose-500 px-2 py-1 text-sm text-white">-40% Off</span>
            </div>
            <h1 className="text-5xl font-extrabold leading-tight text-slate-900">
              Get the Best Deals
              <br />
              Without Going Over
              <br />
              Budget
            </h1>
            <p className="mt-4 text-2xl text-slate-700">Get the Best Deals Without Breaking the Bank</p>
            <div className="mt-8 flex gap-3">
              <Link to={user ? '/dashboard' : '/login'} className="smooth-rise rounded-full bg-lime-500 px-7 py-3 text-lg font-semibold text-white hover:bg-lime-600">
                View Coupons →
              </Link>
              {!user && (
                <Link to="/register" className="smooth-rise rounded-full bg-slate-900 px-7 py-3 text-lg font-semibold text-white">
                  Sign Up
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
