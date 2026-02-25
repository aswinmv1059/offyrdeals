import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const categories = [
  { icon: '⌚', name: 'Fashion & Lifestyle', highlights: ['Ethnic', 'Streetwear', 'Footwear'] },
  { icon: '🍽', name: 'Food & Beverages', highlights: ['Cafe', 'Family Dining', 'Fast Food'] },
  { icon: '✈', name: 'Travel & Tourism', highlights: ['Hotels', 'Flight Deals', 'Holiday Packs'] },
  { icon: '🚗', name: 'Vehicle & Accessories', highlights: ['Service', 'Tyres', 'Accessories'] },
  { icon: '🖥', name: 'Home Care & Appliances', highlights: ['Kitchen', 'Cleaning', 'Smart Home'] },
  { icon: '🧪', name: 'Medical Care & Pharmaceuticals', highlights: ['Diagnostics', 'Medicines', 'Wellness Kits'] },
  { icon: '🧘', name: 'Fitness & Wellness', highlights: ['Gym', 'Yoga', 'Nutrition'] },
  { icon: '🚚', name: 'Transportation & Logistics', highlights: ['Cargo', 'Courier', 'Packers'] },
  { icon: '👕', name: 'Kids Fashion & Entertainments', highlights: ['Toys', 'Kids Wear', 'Learning'] },
  { icon: '⭐', name: 'Best Selling Products', highlights: ['Top Rated', 'Most Redeemed', 'Editor Picks'] }
];

const tickerOffers = [
  '🔥 Zomato Super Saver - 55% OFF',
  '⚡ KFC Family Feast - Coupon @ ₹29',
  '🎬 Movie + Popcorn Pass - Flat ₹180 Save',
  '👟 Decathlon Running Sale - 35% OFF',
  '🛒 Grocery Sunday Bonanza - 30% OFF'
];

const featuredOffers = [
  { title: 'Family Pizza Fiesta', brand: "Domino's", discount: '42% OFF', city: 'Kochi', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80' },
  { title: 'Gym Starter Bundle', brand: 'FitZone', discount: '31% OFF', city: 'Thrissur', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80' },
  { title: 'Fashion Combo Pack', brand: 'Myntra', discount: '48% OFF', city: 'Calicut', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80' },
  { title: 'Weekend Family Cinema', brand: 'CineWorld', discount: '37% OFF', city: 'Trivandrum', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80' },
  { title: 'Smart Grocery Box', brand: 'Reliance Smart', discount: '27% OFF', city: 'Ernakulam', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80' },
  { title: 'Travel Escape Deal', brand: 'TripKart', discount: '33% OFF', city: 'Wayanad', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80' }
];

const steps = [
  { title: '1. Discover', desc: 'Browse local offers by category, district, and vendor ratings.' },
  { title: '2. Buy Coupon', desc: 'Add to cart and purchase with instant confirmation and secure checkout.' },
  { title: '3. Redeem', desc: 'Show code/QR at store and save instantly on every transaction.' }
];

const stats = [
  { label: 'Active Offers', value: '12,500+' },
  { label: 'Partner Vendors', value: '860+' },
  { label: 'Happy Users', value: '1.9L+' },
  { label: 'Monthly Redemptions', value: '58K+' }
];

export default function LandingPage() {
  const { user } = useAuth();
  const logoSrc = `${import.meta.env.BASE_URL}offeyr-logo-mark.svg`;
  const [expandedCategory, setExpandedCategory] = useState(null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef6ff]">
      <div className="landing-blob landing-blob-a" />
      <div className="landing-blob landing-blob-b" />
      <div className="landing-blob landing-blob-c" />

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
        <aside
          className="liquid-glass rounded-xl border border-slate-200 bg-white/70"
          onMouseLeave={() => setExpandedCategory(null)}
        >
          {categories.map((category, idx) => (
            <article
              key={category.name}
              onMouseEnter={() => setExpandedCategory(idx)}
              className={`${idx !== categories.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <button className="smooth-rise flex w-full items-center justify-between px-5 py-4 text-left font-medium text-slate-700 hover:bg-lime-50">
                <span className="flex items-center gap-3 text-[16px]">
                  <span className="text-[20px]">{category.icon}</span>
                  <span>{category.name}</span>
                </span>
                <span className={`transition-transform ${expandedCategory === idx ? 'rotate-90' : ''}`}>›</span>
              </button>
              <div
                className={`overflow-hidden bg-white/70 px-5 transition-all duration-300 ${
                  expandedCategory === idx ? 'max-h-20 py-3 opacity-100' : 'max-h-0 py-0 opacity-0'
                }`}
              >
                <div className="flex flex-wrap gap-2 text-xs">
                  {category.highlights.map((item) => (
                    <span key={item} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-slate-700">
                      {item}
                    </span>
                  ))}
                  <span className="rounded-full bg-slate-900 px-2 py-1 text-white">Explore</span>
                </div>
              </div>
            </article>
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

      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="offer-ticker liquid-glass rounded-2xl">
          <div className="offer-ticker-track">
            {[...tickerOffers, ...tickerOffers].map((item, idx) => (
              <span key={`${item}-${idx}`} className="offer-chip">{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-4">
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((item) => (
            <article key={item.label} className="glass-card liquid-glass smooth-rise p-4">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="text-3xl font-black text-slate-800">{item.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <h2 className="mb-4 text-3xl font-black text-slate-900">Trending Coupons</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featuredOffers.map((offer) => (
            <article key={offer.title} className="offer-3d-card liquid-glass p-3">
              <img src={offer.image} alt={offer.title} className="h-44 w-full rounded-xl object-cover" />
              <div className="p-2">
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="rounded-full bg-emerald-100 px-2 py-1 font-bold text-emerald-700">{offer.discount}</span>
                  <span className="text-slate-500">{offer.city}</span>
                </div>
                <h3 className="mt-2 text-lg font-bold text-slate-900">{offer.title}</h3>
                <p className="text-sm text-slate-600">{offer.brand}</p>
                <div className="mt-3 flex gap-2">
                  <Link to={user ? '/dashboard' : '/login'} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Buy Coupon</Link>
                  <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">Add to Wishlist</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-3xl border border-slate-700 bg-gradient-to-r from-slate-900 via-sky-800 to-cyan-700 p-6 text-white shadow-2xl">
          <h2 className="text-3xl font-black">How OFFEYR Works</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.title} className="rounded-2xl border border-slate-500/40 bg-slate-900/45 p-4">
                <h3 className="text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-100">{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="glass-card liquid-glass p-5">
            <h3 className="text-2xl font-black">Why Users Love OFFEYR</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>• Massive coupon collection across food, travel, fashion, and essentials.</li>
              <li>• Real-time availability and transparent pricing before checkout.</li>
              <li>• Fast redemption via code or QR at nearby stores.</li>
              <li>• Secure payment flow and user-first coupon tracking dashboard.</li>
            </ul>
          </article>
          <article className="glass-card liquid-glass p-5">
            <h3 className="text-2xl font-black">Start Saving Today</h3>
            <p className="mt-2 text-sm text-slate-600">Join thousands of families reducing daily bills with smart local deals.</p>
            <div className="mt-4 flex gap-3">
              <Link to={user ? '/dashboard' : '/register'} className="primary-btn smooth-rise">Create Free Account</Link>
              <Link to={user ? '/dashboard' : '/login'} className="smooth-rise rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">Login</Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
