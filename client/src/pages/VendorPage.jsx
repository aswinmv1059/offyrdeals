import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const initialForm = {
  title: '',
  description: '',
  image_url: '',
  actual_price: '',
  discounted_price: '',
  coupon_price: '',
  expiry_date: '',
  max_redemptions: 100,
  category: ''
};

const rupee = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const dummyClicks = [220, 315, 198, 420, 360, 510, 470];
const dummyDailySales = [18000, 24500, 21900, 32700, 28900, 35200, 34100];
const dummyMonthlySales = [
  ['Jan', 210000],
  ['Feb', 238000],
  ['Mar', 268000],
  ['Apr', 302000],
  ['May', 351000],
  ['Jun', 388000]
];

export default function VendorPage() {
  const [activeTab, setActiveTab] = useState('offers');
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [couponCode, setCouponCode] = useState('');
  const [scanPayload, setScanPayload] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/vendor/offers');
      setOffers(response.data.offers || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const submitOffer = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const payload = {
        ...form,
        actual_price: Number(form.actual_price || 0),
        discounted_price: Number(form.discounted_price || 0),
        coupon_price: Number(form.coupon_price || 0),
        max_redemptions: Number(form.max_redemptions || 100)
      };
      if (editingId) {
        await api.put(`/vendor/offers/${editingId}`, payload);
      } else {
        await api.post('/vendor/offers', payload);
      }
      setForm(initialForm);
      setEditingId(null);
      await loadOffers();
      setMessage('Offer saved successfully');
      setActiveTab('offers');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Offer save failed');
    }
  };

  const editOffer = (offer) => {
    setEditingId(offer._id);
    setForm({
      title: offer.title || '',
      description: offer.description || '',
      image_url: offer.image_url || '',
      actual_price: offer.actual_price ?? '',
      discounted_price: offer.discounted_price ?? '',
      coupon_price: offer.coupon_price ?? '',
      expiry_date: offer.expiry_date?.slice(0, 16) || '',
      max_redemptions: offer.max_redemptions || 100,
      category: offer.category || ''
    });
    setActiveTab('add');
  };

  const extractCouponFromScan = () => {
    const uuidMatch = scanPayload.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    if (uuidMatch) {
      setCouponCode(uuidMatch[0]);
      setMessage('Coupon code extracted from scanned payload');
    } else {
      setMessage('No valid coupon UUID found in scanned payload');
    }
  };

  const confirm = async () => {
    setMessage('');
    try {
      const response = await api.post('/vendor/confirm-redemption', { coupon_id: couponCode });
      setMessage(response.data.message || 'Coupon redeemed successfully');
      setCouponCode('');
      setScanPayload('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Confirmation failed');
    }
  };

  const analytics = useMemo(() => {
    const soldData = offers.map((offer, index) => {
      const units = 80 + index * 33;
      const finalAmount = Number(offer.discounted_price || 0) + Number(offer.coupon_price || 0);
      const revenue = units * finalAmount;
      return {
        id: offer._id,
        title: offer.title,
        units,
        revenue,
        clicks: dummyClicks[index % dummyClicks.length]
      };
    });

    const bestSold = soldData.sort((a, b) => b.units - a.units)[0];
    const totalRevenue = soldData.reduce((acc, item) => acc + item.revenue, 0);
    return {
      soldData,
      bestSold,
      totalRevenue
    };
  }, [offers]);

  return (
    <div className="space-y-6">
      <section className="liquid-glass rounded-3xl bg-gradient-to-r from-cyan-500 to-emerald-500 p-6 text-white">
        <h1 className="text-3xl font-black">🏪 Vendor Control Hub</h1>
        <p className="mt-2 text-sm text-cyan-50">Manage offers, redeem issued coupons, and track sales performance in one place.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/15 p-3">
            <p className="text-xs uppercase">Total Offers</p>
            <p className="text-2xl font-bold">{offers.length}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3">
            <p className="text-xs uppercase">Best Sold</p>
            <p className="text-lg font-bold">{analytics.bestSold?.title || 'No data'}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3">
            <p className="text-xs uppercase">Revenue (Dummy)</p>
            <p className="text-2xl font-bold">{rupee(analytics.totalRevenue)}</p>
          </div>
        </div>
      </section>

      <section className="liquid-glass rounded-2xl bg-white/70 p-3">
        <div className="grid gap-2 md:grid-cols-3">
          <button onClick={() => setActiveTab('offers')} className={`rounded-xl px-4 py-3 text-sm font-semibold ${activeTab === 'offers' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}>Offers</button>
          <button onClick={() => setActiveTab('add')} className={`rounded-xl px-4 py-3 text-sm font-semibold ${activeTab === 'add' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}>Add Offer</button>
          <button onClick={() => setActiveTab('redeem')} className={`rounded-xl px-4 py-3 text-sm font-semibold ${activeTab === 'redeem' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}>Redeem Coupons</button>
        </div>
        <div className="mt-2">
          <button onClick={() => setActiveTab('analytics')} className={`w-full rounded-xl px-4 py-3 text-sm font-semibold ${activeTab === 'analytics' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}>Analytics Tools</button>
        </div>
      </section>

      {message && <p className="rounded-xl bg-slate-100 p-3 text-sm">{message}</p>}

      {activeTab === 'offers' && (
        <section className="grid gap-4 md:grid-cols-2">
          {offers.map((offer) => {
            const finalAmount = Number(offer.discounted_price || 0) + Number(offer.coupon_price || 0);
            return (
              <article key={offer._id} className="glass-card liquid-glass smooth-rise p-4">
                {offer.image_url ? (
                  <img src={offer.image_url} alt={offer.title} className="h-36 w-full rounded-xl object-cover" />
                ) : (
                  <div className="grid h-36 place-items-center rounded-xl bg-slate-100 text-4xl">🎟️</div>
                )}
                <h3 className="mt-3 text-lg font-bold">{offer.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{offer.description}</p>
                <p className="mt-2 text-xs text-slate-500">Expiry: {new Date(offer.expiry_date).toLocaleString()}</p>
                <p className="text-xs text-slate-500">Category: {offer.category}</p>
                <div className="mt-2 text-sm">
                  <p>Actual: <b>{rupee(offer.actual_price)}</b></p>
                  <p>Discounted: <b>{rupee(offer.discounted_price)}</b></p>
                  <p>Coupon Price: <b>{rupee(offer.coupon_price)}</b></p>
                  <p>Final Amount: <b>{rupee(finalAmount)}</b></p>
                </div>
                <button className="primary-btn mt-3 px-3 py-2 text-sm" onClick={() => editOffer(offer)}>Edit Offer</button>
              </article>
            );
          })}
          {!loading && offers.length === 0 && (
            <div className="glass-card p-6 text-sm text-slate-500">No offers yet. Use Add Offer to create your first coupon deal.</div>
          )}
        </section>
      )}

      {activeTab === 'add' && (
        <section className="glass-card liquid-glass p-5">
          <h2 className="text-xl font-bold">{editingId ? '✏️ Update Offer' : '➕ Add New Offer'}</h2>
          <form onSubmit={submitOffer} className="mt-4 grid gap-3 md:grid-cols-2">
            <input className="input-field" placeholder="Offer title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="input-field" placeholder="Category" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <textarea className="input-field md:col-span-2" placeholder="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input className="input-field md:col-span-2" placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <input className="input-field" type="number" min="0" step="0.01" placeholder="Actual price" value={form.actual_price} onChange={(e) => setForm({ ...form, actual_price: e.target.value })} />
            <input className="input-field" type="number" min="0" step="0.01" placeholder="Final amount after discount" value={form.discounted_price} onChange={(e) => setForm({ ...form, discounted_price: e.target.value })} />
            <input className="input-field" type="number" min="0" step="0.01" placeholder="Coupon buy price" value={form.coupon_price} onChange={(e) => setForm({ ...form, coupon_price: e.target.value })} />
            <input className="input-field" type="number" min="1" placeholder="Max redemptions" value={form.max_redemptions} onChange={(e) => setForm({ ...form, max_redemptions: e.target.value })} />
            <input className="input-field md:col-span-2" type="datetime-local" required value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
            <button className="primary-btn md:col-span-2" type="submit">{editingId ? 'Update Offer' : 'Create Offer'}</button>
          </form>
        </section>
      )}

      {activeTab === 'redeem' && (
        <section className="glass-card liquid-glass p-5">
          <h2 className="text-xl font-bold">✅ Redeem Issued Coupon</h2>
          <p className="mt-1 text-sm text-slate-600">Scan payload or type the unique coupon code to confirm redemption.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-white/60 p-4">
              <h3 className="font-semibold">Manual Code Entry</h3>
              <input className="input-field mt-2" placeholder="Coupon UUID" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
              <button className="primary-btn mt-3 w-full" onClick={confirm}>Redeem by Code</button>
            </div>
            <div className="rounded-xl bg-white/60 p-4">
              <h3 className="font-semibold">Scan/Paste QR Payload</h3>
              <textarea className="input-field mt-2 min-h-24" placeholder='Paste scanned QR text here (e.g. {"coupon_id":"...","expires_at":"..."})' value={scanPayload} onChange={(e) => setScanPayload(e.target.value)} />
              <button className="primary-btn mt-3 w-full" onClick={extractCouponFromScan}>Extract Coupon Code</button>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'analytics' && (
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="glass-card liquid-glass p-4">
              <p className="text-xs uppercase text-slate-500">Best Sold Offer</p>
              <p className="mt-1 font-bold">{analytics.bestSold?.title || 'No offer yet'}</p>
            </article>
            <article className="glass-card liquid-glass p-4">
              <p className="text-xs uppercase text-slate-500">Total Clicks (Dummy)</p>
              <p className="mt-1 text-2xl font-black">{dummyClicks.reduce((a, b) => a + b, 0)}</p>
            </article>
            <article className="glass-card liquid-glass p-4">
              <p className="text-xs uppercase text-slate-500">Daily Sale (Today)</p>
              <p className="mt-1 text-2xl font-black">{rupee(dummyDailySales[dummyDailySales.length - 1])}</p>
            </article>
            <article className="glass-card liquid-glass p-4">
              <p className="text-xs uppercase text-slate-500">Monthly Sale (Current)</p>
              <p className="mt-1 text-2xl font-black">{rupee(dummyMonthlySales[dummyMonthlySales.length - 1][1])}</p>
            </article>
          </div>

          <article className="glass-card liquid-glass p-4">
            <h3 className="text-lg font-bold">Products Sold & Offer Clicks (Dummy)</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="pb-2">Offer</th>
                    <th className="pb-2">Units Sold</th>
                    <th className="pb-2">Clicks</th>
                    <th className="pb-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.soldData.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200/70">
                      <td className="py-2">{item.title}</td>
                      <td>{item.units}</td>
                      <td>{item.clicks}</td>
                      <td>{rupee(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="glass-card liquid-glass p-4">
              <h3 className="font-bold">Daily Sales Trend (Dummy)</h3>
              <div className="mt-3 space-y-2">
                {dummyDailySales.map((value, idx) => (
                  <div key={idx}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>Day {idx + 1}</span>
                      <span>{rupee(value)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" style={{ width: `${(value / 36000) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
            <article className="glass-card liquid-glass p-4">
              <h3 className="font-bold">Monthly Sales (Dummy)</h3>
              <div className="mt-3 space-y-2">
                {dummyMonthlySales.map(([month, value]) => (
                  <div key={month}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{month}</span>
                      <span>{rupee(value)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" style={{ width: `${(value / 400000) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}
    </div>
  );
}
