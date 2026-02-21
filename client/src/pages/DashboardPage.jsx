import { useEffect, useState } from 'react';
import api from '../api/client';

const dummyRecommendations = [
  { title: 'Weekend Burger Combo', brand: 'McDonald\'s', discount: '35% OFF', eta: '2 km away' },
  { title: 'Sports Shoes Mega Deal', brand: 'Decathlon', discount: '28% OFF', eta: '4 km away' },
  { title: 'Family Pizza Pack', brand: 'Domino\'s', discount: '30% OFF', eta: '1.5 km away' },
  { title: 'Grocery Saver Kit', brand: 'Reliance Smart', discount: '18% OFF', eta: '3 km away' },
  { title: 'Premium Salon Package', brand: 'Urban Spa', discount: '40% OFF', eta: '5 km away' },
  { title: 'Movie + Snacks Coupon', brand: 'CineWorld', discount: '22% OFF', eta: '6 km away' },
  { title: 'Bike Service Bundle', brand: 'MotoCare', discount: '25% OFF', eta: '7 km away' },
  { title: 'Fitness Club Monthly', brand: 'FitZone', discount: '33% OFF', eta: '2.5 km away' }
];

const dummyRecentActivity = [
  'Redeemed Zomato Combo Offer successfully.',
  'Coupon for KFC Bucket Meal expires in 2 hours.',
  'New fashion coupon unlocked in Kochi.',
  'Your referral earned a ₹60 coupon credit.',
  'Vendor confirmed redemption for Domino Pizza Combo.',
  'Weekend flash sale starts in 4 hours.'
];

const dummyTopCategories = [
  { name: 'Food', sold: 4580 },
  { name: 'Fashion', sold: 3120 },
  { name: 'Travel', sold: 1980 },
  { name: 'Fitness', sold: 1410 },
  { name: 'Electronics', sold: 1280 }
];

const dummyCouponHistory = Array.from({ length: 12 }).map((_, index) => ({
  id: `DUMMY-${1000 + index}`,
  offer: ['Pizza Combo', 'Salon Cut', 'Sports Kit', 'Movie Pass', 'Grocery Pack'][index % 5],
  amountSaved: 120 + index * 15,
  status: index % 3 === 0 ? 'REDEEMED' : index % 3 === 1 ? 'ACTIVE' : 'EXPIRED'
}));

export default function DashboardPage() {
  const [offers, setOffers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [error, setError] = useState('');

  const loadOffers = async () => {
    try {
      const [offerResponse, couponResponse] = await Promise.all([
        api.get('/user/offers', { params: category ? { category } : {} }),
        api.get('/user/coupons')
      ]);
      setOffers(offerResponse.data.offers || []);
      setCoupons(couponResponse.data.coupons || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load offers');
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const redeem = async (offerId) => {
    setError('');
    try {
      const response = await api.post('/user/redeem', { offerId });
      setCoupon(response.data.coupon);
    } catch (err) {
      setError(err.response?.data?.message || 'Redeem failed');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-sky-100 bg-gradient-to-r from-slate-900 via-sky-800 to-cyan-700 p-5 text-white shadow-2xl md:p-6">
        <h1 className="text-2xl font-extrabold md:text-3xl">🛍 Customer Dashboard</h1>
        <p className="text-sm text-sky-100">Discover nearby deals, redeem smart coupons, and track your active rewards.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs uppercase">Available Offers</p><p className="text-2xl font-bold">{offers.length}</p></div>
          <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs uppercase">Active Coupons</p><p className="text-2xl font-bold">{coupons.filter((c) => c.status === 'ACTIVE').length}</p></div>
          <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs uppercase">Redeemed</p><p className="text-2xl font-bold">{coupons.filter((c) => c.status === 'REDEEMED').length}</p></div>
          <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs uppercase">Expired</p><p className="text-2xl font-bold">{coupons.filter((c) => c.status === 'EXPIRED').length}</p></div>
        </div>
      </section>

      <section className="glass-card p-5">
        <h2 className="text-xl font-bold">🔎 Explore Nearby Deals</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input className="input-field" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Enter location (e.g., Kochi)" />
          <input className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (Food, Sports, Fashion)" />
          <button className="primary-btn" onClick={loadOffers}>Search Deals</button>
        </div>
      </section>

      {error && <p className="rounded-xl bg-red-100 p-3 text-sm text-red-700">{error}</p>}

      <section className="grid gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <article key={offer._id} className="glass-card p-4">
            <h2 className="text-lg font-bold">{offer.title}</h2>
            <p className="mt-2 text-sm">{offer.description}</p>
            <div className="mt-2 text-xs text-slate-600">Category: {offer.category}</div>
            <div className="text-xs text-slate-600">Expiry: {new Date(offer.expiry_date).toLocaleString()}</div>
            <button className="primary-btn mt-3 text-sm" onClick={() => redeem(offer._id)}>
              Redeem Now
            </button>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="glass-card p-4 lg:col-span-2">
          <h2 className="text-xl font-bold">💡 Recommended For You (Dummy Data)</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {dummyRecommendations.map((item) => (
              <div key={item.title} className="rounded-xl border border-sky-100 bg-white p-3">
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-slate-500">{item.brand}</p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="rounded-full bg-emerald-100 px-2 py-1 font-bold text-emerald-700">{item.discount}</span>
                  <span className="text-slate-500">{item.eta}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="glass-card p-4">
          <h2 className="text-xl font-bold">📍 Top Categories (Dummy)</h2>
          <div className="mt-3 space-y-3">
            {dummyTopCategories.map((cat) => (
              <div key={cat.name}>
                <div className="mb-1 flex justify-between text-xs font-semibold">
                  <span>{cat.name}</span>
                  <span>{cat.sold} sold</span>
                </div>
                <div className="h-2 rounded-full bg-sky-100">
                  <div className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-teal-500" style={{ width: `${Math.round((cat.sold / dummyTopCategories[0].sold) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {coupon && (
        <section className="glass-card p-4">
          <h2 className="text-xl font-extrabold">🎟 Coupon Generated</h2>
          <p className="text-sm">Status: {coupon.status}</p>
          <p className="text-sm">Expires: {new Date(coupon.expires_at).toLocaleString()}</p>
          <img src={coupon.qr_code} alt="Coupon QR" className="mt-3 h-52 w-52 rounded-xl border border-orange-100 bg-white p-2" />
          <p className="mt-2 rounded bg-slate-900 p-2 font-mono text-xs text-white">{coupon.coupon_id}</p>
        </section>
      )}

      <section className="glass-card p-4">
        <h2 className="text-xl font-bold">📦 My Coupons</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {coupons.slice(0, 6).map((item) => (
            <article key={item._id} className="rounded-xl border border-sky-100 bg-white p-3">
              <p className="font-semibold">{item.offer_id?.title || 'Offer'}</p>
              <p className="text-xs text-slate-500">{item.coupon_id}</p>
              <p className="mt-1 text-xs">
                Status: <span className="font-bold">{item.status}</span>
              </p>
            </article>
          ))}
          {coupons.length === 0 && <p className="text-sm text-slate-500">No coupons yet. Redeem an offer to get started.</p>}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="glass-card p-4">
          <h2 className="text-xl font-bold">🧾 Coupon History (Dummy Data)</h2>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
            {dummyCouponHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-sky-100 bg-white p-3 text-sm">
                <div>
                  <p className="font-semibold">{item.offer}</p>
                  <p className="text-xs text-slate-500">{item.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-700">₹{item.amountSaved} saved</p>
                  <p className="text-xs">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="glass-card p-4">
          <h2 className="text-xl font-bold">🕒 Recent Activity (Dummy Data)</h2>
          <ul className="mt-3 space-y-2">
            {dummyRecentActivity.map((line) => (
              <li key={line} className="rounded-xl border border-sky-100 bg-white p-3 text-sm">
                {line}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
