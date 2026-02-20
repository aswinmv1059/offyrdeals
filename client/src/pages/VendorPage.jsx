import { useEffect, useState } from 'react';
import api from '../api/client';

const initialForm = {
  title: '',
  description: '',
  expiry_date: '',
  max_redemptions: 100,
  category: ''
};

export default function VendorPage() {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [couponCode, setCouponCode] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);

  const loadOffers = async () => {
    const response = await api.get('/vendor/offers');
    setOffers(response.data.offers || []);
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const submitOffer = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      if (editingId) {
        await api.put(`/vendor/offers/${editingId}`, form);
      } else {
        await api.post('/vendor/offers', form);
      }
      setForm(initialForm);
      setEditingId(null);
      await loadOffers();
      setMessage('Offer saved');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Offer save failed');
    }
  };

  const editOffer = (offer) => {
    setEditingId(offer._id);
    setForm({
      title: offer.title,
      description: offer.description,
      expiry_date: offer.expiry_date?.slice(0, 16),
      max_redemptions: offer.max_redemptions,
      category: offer.category
    });
  };

  const confirm = async () => {
    setMessage('');
    try {
      const response = await api.post('/vendor/confirm-redemption', { coupon_id: couponCode });
      setMessage(response.data.message);
      setCouponCode('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Confirmation failed');
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-card p-4">
        <h1 className="text-2xl font-extrabold">🏪 Vendor Dashboard</h1>
        <form onSubmit={submitOffer} className="mt-3 grid gap-3 md:grid-cols-2">
          <input className="input-field" placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="input-field" placeholder="Category" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <textarea className="input-field md:col-span-2" placeholder="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="input-field" type="datetime-local" required value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
          <input className="input-field" type="number" min="1" required value={form.max_redemptions} onChange={(e) => setForm({ ...form, max_redemptions: Number(e.target.value) })} />
          <button className="primary-btn md:col-span-2" type="submit">{editingId ? 'Update Offer' : 'Create Offer'}</button>
        </form>
      </section>

      <section className="glass-card p-4">
        <h2 className="text-lg font-semibold">✅ Confirm Coupon Redemption</h2>
        <div className="mt-3 flex gap-2">
          <input className="input-field flex-1" placeholder="Enter coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
          <button className="primary-btn px-3 py-2" onClick={confirm}>Confirm</button>
        </div>
      </section>

      {message && <p className="rounded-xl bg-slate-100 p-3 text-sm">{message}</p>}

      <section className="grid gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <article key={offer._id} className="glass-card p-4">
            <h3 className="font-semibold">{offer.title}</h3>
            <p className="text-sm">{offer.description}</p>
            <p className="text-xs">Expiry: {new Date(offer.expiry_date).toLocaleString()}</p>
            <button className="primary-btn mt-2 px-3 py-1 text-sm" onClick={() => editOffer(offer)}>Edit</button>
          </article>
        ))}
      </section>
    </div>
  );
}
