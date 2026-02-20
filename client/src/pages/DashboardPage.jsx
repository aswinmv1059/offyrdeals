import { useEffect, useState } from 'react';
import api from '../api/client';

export default function DashboardPage() {
  const [offers, setOffers] = useState([]);
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [error, setError] = useState('');

  const loadOffers = async () => {
    try {
      const response = await api.get('/user/offers', { params: category ? { category } : {} });
      setOffers(response.data.offers || []);
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
      <section className="glass-card p-5 md:p-6">
        <h1 className="text-2xl font-extrabold md:text-3xl">🔥 Nearby Offers</h1>
        <p className="text-sm text-slate-700">Find offers by area and category.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input className="input-field" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="📍 Enter location" />
          <input className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="🏷 Filter category" />
          <button className="primary-btn" onClick={loadOffers}>Search Deals</button>
        </div>
      </section>

      {error && <p className="rounded-xl bg-red-100 p-3 text-sm text-red-700">{error}</p>}

      <section className="grid gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <article key={offer._id} className="glass-card p-4">
            <h2 className="text-lg font-bold">{offer.title}</h2>
            <p className="mt-2 text-sm">{offer.description}</p>
            <div className="mt-2 text-xs text-slate-600">🏷 Category: {offer.category}</div>
            <div className="text-xs text-slate-600">⏰ Expiry: {new Date(offer.expiry_date).toLocaleString()}</div>
            <button className="primary-btn mt-3 text-sm" onClick={() => redeem(offer._id)}>
              Redeem Now
            </button>
          </article>
        ))}
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
    </div>
  );
}
