import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const dummyCouponsAvailable = [
  { id: 'AVL-2001', title: 'Weekend Pizza Blast', brand: "Domino's", price: 49, finalAmount: 299, status: 'AVAILABLE' },
  { id: 'AVL-2002', title: 'Family Grocery Saver', brand: 'Reliance Smart', price: 39, finalAmount: 899, status: 'AVAILABLE' },
  { id: 'AVL-2003', title: 'Sports Combo Deal', brand: 'Decathlon', price: 59, finalAmount: 1499, status: 'AVAILABLE' },
  { id: 'AVL-2004', title: 'Burger Duo Offer', brand: 'KFC', price: 29, finalAmount: 249, status: 'AVAILABLE' }
];

const dummyCouponsPurchased = [
  { id: 'PUR-4001', title: 'Salon Premium Cut', amount: 35, finalAmount: 449, purchasedAt: '2026-02-21T10:00:00Z', status: 'ACTIVE' },
  { id: 'PUR-4002', title: 'Movie Gold Ticket', amount: 45, finalAmount: 299, purchasedAt: '2026-02-22T16:00:00Z', status: 'ACTIVE' },
  { id: 'PUR-4003', title: 'Quick Grocery Kit', amount: 25, finalAmount: 599, purchasedAt: '2026-02-23T12:30:00Z', status: 'ACTIVE' }
];

const dummyCouponsRedeemed = [
  { id: 'RED-3001', title: 'Zomato Lunch Combo', saved: 180, redeemedAt: '2026-02-19T12:15:00Z', status: 'REDEEMED' },
  { id: 'RED-3002', title: 'Cinema Couple Pass', saved: 220, redeemedAt: '2026-02-18T20:30:00Z', status: 'REDEEMED' }
];

const membershipPlans = [
  { name: 'Silver', price: '₹99/mo', benefit: 'Early access to flash coupons' },
  { name: 'Gold', price: '₹199/mo', benefit: 'Extra 5% on every coupon purchase' },
  { name: 'Platinum', price: '₹299/mo', benefit: 'Priority support + exclusive partner deals' }
];

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [offers, setOffers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [cart, setCart] = useState([]);
  const [coupon, setCoupon] = useState(null);
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('Kochi');
  const [error, setError] = useState('');
  const [processingOfferId, setProcessingOfferId] = useState('');

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

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.coupon_price || item.price || 0), 0),
    [cart]
  );

  const addToCart = (offer) => {
    if (cart.some((item) => item._id === offer._id)) return;
    setCart((prev) => [...prev, offer]);
  };

  const mapDummyToOffer = (dummyItem) => {
    if (!offers.length) return null;
    const byBrand = offers.find((offer) =>
      String(offer.vendor_id?.name || '').toLowerCase().includes(String(dummyItem.brand || '').toLowerCase())
    );
    if (byBrand) return byBrand;
    const byTitle = offers.find((offer) =>
      String(offer.title || '').toLowerCase().includes(String(dummyItem.title || '').toLowerCase())
    );
    return byTitle || offers[0];
  };

  const buyDummyCoupon = async (dummyItem) => {
    const offer = mapDummyToOffer(dummyItem);
    if (!offer?._id) {
      setError('No live offer found for this coupon right now. Ask vendor to publish offers.');
      return;
    }
    await buyCoupon(offer);
  };

  const removeFromCart = (offerId) => {
    setCart((prev) => prev.filter((item) => item._id !== offerId));
  };

  const buyCoupon = async (offer) => {
    setError('');
    setProcessingOfferId(offer._id);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Check network and retry.');
      }

      const orderResponse = await api.post('/user/create-payment-order', { offerId: offer._id });
      const { order, key_id } = orderResponse.data;

      const paymentResult = await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: key_id,
          amount: order.amount,
          currency: order.currency,
          name: 'OFFEYR Deals',
          description: `Coupon Purchase - ${offer.title}`,
          order_id: order.id,
          prefill: {
            name: user?.name || 'OFFEYR User',
            email: user?.email || '',
            contact: user?.phone || ''
          },
          theme: { color: '#0ea5e9' },
          handler: (response) => resolve(response),
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) }
        });
        rzp.open();
      });

      const verifyResponse = await api.post('/user/verify-payment', {
        offerId: offer._id,
        ...paymentResult
      });

      setCoupon(verifyResponse.data.coupon);
      await loadOffers();
      removeFromCart(offer._id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment failed');
    } finally {
      setProcessingOfferId('');
    }
  };

  const openSettings = () => {
    setError('Settings module is in demo mode');
  };

  const userLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-700 bg-gradient-to-r from-slate-900 via-sky-800 to-cyan-700 p-5 text-white shadow-2xl md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold md:text-3xl">🛍 OFFEYR Shopping Dashboard</h1>
            <p className="text-sm text-sky-100">Coupons marketplace with cart, payment, membership, and account controls.</p>
          </div>
          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-3">
            <button className="rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold">🧾 Account: {user?.name || 'User'}</button>
            <button className="rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold">💎 Membership</button>
            <button className="rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold" onClick={openSettings}>⚙ Settings</button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-6">
          <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs uppercase">Available Offers</p><p className="text-2xl font-bold">{offers.length}</p></div>
          <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs uppercase">Cart Items</p><p className="text-2xl font-bold">{cart.length}</p></div>
          <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs uppercase">Cart Value</p><p className="text-2xl font-bold">{formatMoney(cartTotal)}</p></div>
          <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs uppercase">Purchased</p><p className="text-2xl font-bold">{dummyCouponsPurchased.length}</p></div>
          <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs uppercase">Redeemed</p><p className="text-2xl font-bold">{dummyCouponsRedeemed.length + coupons.filter((c) => c.status === 'REDEEMED').length}</p></div>
          <button className="rounded-2xl bg-rose-500/90 p-3 text-left" onClick={userLogout}><p className="text-xs uppercase">Session</p><p className="text-2xl font-bold">Logout</p></button>
        </div>
      </section>

      <section className="glass-card liquid-glass p-5">
        <h2 className="text-xl font-bold">🛒 Cart & Checkout</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="rounded-xl bg-white/70 p-3">
            {cart.length === 0 ? (
              <p className="text-sm text-slate-500">Cart is empty. Add coupons from available offers.</p>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item._id} className="flex items-center justify-between rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm">
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-xs text-slate-500">Coupon price: {formatMoney(item.coupon_price || 0)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-lg bg-emerald-600 px-3 py-1 text-white" onClick={() => buyCoupon(item)} disabled={processingOfferId === item._id}>
                        {processingOfferId === item._id ? 'Processing...' : 'Pay & Buy'}
                      </button>
                      <button className="rounded-lg border border-slate-300 px-3 py-1" onClick={() => removeFromCart(item._id)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl bg-white/70 p-3 text-right">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-2xl font-black">{formatMoney(cartTotal)}</p>
            <p className="mt-2 text-xs text-slate-500">Razorpay secure checkout</p>
          </div>
        </div>
      </section>

      <section className="glass-card liquid-glass p-5">
        <h2 className="text-xl font-bold">🔎 Browse Offers</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input className="input-field" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
          <input className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
          <button className="primary-btn" onClick={loadOffers}>Search Offers</button>
        </div>
      </section>

      {error && <p className="rounded-xl bg-red-100 p-3 text-sm text-red-700">{error}</p>}

      <section className="grid gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <article key={offer._id} className="glass-card liquid-glass smooth-rise p-4">
            {offer.image_url ? (
              <img src={offer.image_url} alt={offer.title} className="h-40 w-full rounded-xl object-cover" />
            ) : (
              <div className="grid h-40 place-items-center rounded-xl bg-slate-100 text-4xl">🎟️</div>
            )}
            <h2 className="mt-3 text-lg font-bold">{offer.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{offer.description}</p>
            <p className="mt-2 text-xs text-slate-500">Category: {offer.category}</p>
            <p className="text-xs text-slate-500">Final amount: {formatMoney(offer.discounted_price || 0)}</p>
            <p className="text-xs text-slate-500">Coupon buy price: {formatMoney(offer.coupon_price || 0)}</p>
            <div className="mt-3 flex gap-2">
              <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white" onClick={() => addToCart(offer)}>Add to Cart</button>
              <button className="primary-btn text-sm" onClick={() => buyCoupon(offer)} disabled={processingOfferId === offer._id}>
                {processingOfferId === offer._id ? 'Processing...' : 'Buy Coupon'}
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="glass-card liquid-glass p-4">
          <h2 className="text-lg font-bold">🎫 Coupons Available (Dummy)</h2>
          <div className="mt-3 space-y-2">
            {dummyCouponsAvailable.map((item) => (
              <div key={item.id} className="rounded-xl border border-sky-100 bg-white p-3 text-sm">
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-slate-500">{item.brand}</p>
                <p className="text-xs">Coupon: {formatMoney(item.price)} | Final: {formatMoney(item.finalAmount)}</p>
                <button
                  className="primary-btn mt-2 text-xs"
                  onClick={() => buyDummyCoupon(item)}
                  disabled={Boolean(processingOfferId)}
                >
                  {processingOfferId ? 'Processing...' : 'Buy with Razorpay'}
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-card liquid-glass p-4">
          <h2 className="text-lg font-bold">🧾 Coupons Purchased (Dummy)</h2>
          <div className="mt-3 space-y-2">
            {dummyCouponsPurchased.map((item) => (
              <div key={item.id} className="rounded-xl border border-sky-100 bg-white p-3 text-sm">
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-slate-500">{item.id}</p>
                <p className="text-xs">Paid: {formatMoney(item.amount)} | Final: {formatMoney(item.finalAmount)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-card liquid-glass p-4">
          <h2 className="text-lg font-bold">✅ Coupons Redeemed</h2>
          <div className="mt-3 space-y-2">
            {dummyCouponsRedeemed.map((item) => (
              <div key={item.id} className="rounded-xl border border-sky-100 bg-white p-3 text-sm">
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-slate-500">{item.id}</p>
                <p className="text-xs text-emerald-700">Saved {formatMoney(item.saved)}</p>
              </div>
            ))}
            {coupons.slice(0, 3).map((item) => (
              <div key={item._id} className="rounded-xl border border-sky-100 bg-white p-3 text-sm">
                <p className="font-semibold">{item.offer_id?.title || 'Offer'}</p>
                <p className="text-xs text-slate-500">{item.coupon_id}</p>
                <p className="text-xs">Status: <b>{item.status}</b></p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="glass-card liquid-glass p-5">
        <h2 className="text-xl font-bold">💎 Membership Plans</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {membershipPlans.map((plan) => (
            <article key={plan.name} className="rounded-xl border border-sky-100 bg-white p-4">
              <p className="text-lg font-bold">{plan.name}</p>
              <p className="text-sm text-slate-500">{plan.price}</p>
              <p className="mt-2 text-xs">{plan.benefit}</p>
              <button className="primary-btn mt-3 w-full text-sm">Choose Plan</button>
            </article>
          ))}
        </div>
      </section>

      {coupon && (
        <section className="glass-card liquid-glass p-4">
          <h2 className="text-xl font-extrabold">🎉 Coupon Purchased Successfully</h2>
          <p className="text-sm">Status: {coupon.status}</p>
          <p className="text-sm">Expires: {new Date(coupon.expires_at).toLocaleString()}</p>
          <img src={coupon.qr_code} alt="Coupon QR" className="mt-3 h-52 w-52 rounded-xl border border-orange-100 bg-white p-2" />
          <p className="mt-2 rounded bg-slate-900 p-2 font-mono text-xs text-white">{coupon.coupon_id}</p>
        </section>
      )}
    </div>
  );
}
