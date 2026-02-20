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
      <section className="rounded bg-white p-4 shadow">
        <h1 className="text-2xl font-bold">Nearby Offers</h1>
        <p className="text-sm text-slate-600">MVP manual location input</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input className="rounded border p-2" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Enter location" />
          <input className="rounded border p-2" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Filter category" />
          <button className="rounded bg-slate-900 p-2 text-white" onClick={loadOffers}>Search</button>
        </div>
      </section>

      {error && <p className="rounded bg-red-100 p-3 text-sm text-red-700">{error}</p>}

      <section className="grid gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <article key={offer._id} className="rounded bg-white p-4 shadow">
            <h2 className="text-lg font-semibold">{offer.title}</h2>
            <p className="mt-2 text-sm">{offer.description}</p>
            <div className="mt-2 text-xs text-slate-600">Category: {offer.category}</div>
            <div className="text-xs text-slate-600">Expiry: {new Date(offer.expiry_date).toLocaleString()}</div>
            <button className="mt-3 rounded bg-emerald-600 px-3 py-2 text-sm text-white" onClick={() => redeem(offer._id)}>
              Redeem
            </button>
          </article>
        ))}
      </section>

      {coupon && (
        <section className="rounded bg-white p-4 shadow">
          <h2 className="text-xl font-bold">Coupon Generated</h2>
          <p className="text-sm">Status: {coupon.status}</p>
          <p className="text-sm">Expires: {new Date(coupon.expires_at).toLocaleString()}</p>
          <img src={coupon.qr_code} alt="Coupon QR" className="mt-3 h-52 w-52 border p-2" />
          <p className="mt-2 font-mono text-sm">{coupon.coupon_id}</p>
        </section>
      )}
    </div>
  );
}
