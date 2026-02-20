import { useMemo, useState } from 'react';

const vendors = [
  { id: 'kfc', name: 'KFC', logo: 'https://upload.wikimedia.org/wikipedia/sco/thumb/b/bf/KFC_logo.svg/320px-KFC_logo.svg.png', commissionRate: 0.14 },
  { id: 'decathlon', name: 'Decathlon', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Decathlon_Logo.svg/320px-Decathlon_Logo.svg.png', commissionRate: 0.11 },
  { id: 'zomato', name: 'Zomato', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Zomato_logo.png/320px-Zomato_logo.png', commissionRate: 0.16 },
  { id: 'swiggy', name: 'Swiggy', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Swiggy_logo.png/320px-Swiggy_logo.png', commissionRate: 0.15 },
  { id: 'dominos', name: "Domino's", logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Dominos_pizza_logo.svg/320px-Dominos_pizza_logo.svg.png', commissionRate: 0.13 },
  { id: 'mcd', name: "McDonald's", logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/McDonald%27s_Golden_Arches.svg/240px-McDonald%27s_Golden_Arches.svg.png', commissionRate: 0.12 },
  { id: 'reliance', name: 'Reliance Smart', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Reliance_Digital.svg/320px-Reliance_Digital.svg.png', commissionRate: 0.1 },
  { id: 'myntra', name: 'Myntra', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Myntra_logo.png/320px-Myntra_logo.png', commissionRate: 0.12 }
];

const products = [
  { id: 'bucket', name: 'KFC Bucket Meal', vendorId: 'kfc', units: 2890, revenue: 1860000, district: 'Ernakulam' },
  { id: 'shoes', name: 'Running Shoes', vendorId: 'decathlon', units: 1630, revenue: 2240000, district: 'Thiruvananthapuram' },
  { id: 'combo', name: 'Zomato Combo Offer', vendorId: 'zomato', units: 3980, revenue: 1985000, district: 'Kozhikode' },
  { id: 'instamart', name: 'Swiggy Instamart Basket', vendorId: 'swiggy', units: 2450, revenue: 1320000, district: 'Ernakulam' },
  { id: 'pizza', name: 'Domino Pizza Combo', vendorId: 'dominos', units: 3375, revenue: 2135000, district: 'Thrissur' },
  { id: 'burger', name: 'McD Family Box', vendorId: 'mcd', units: 1710, revenue: 1280000, district: 'Kannur' },
  { id: 'groceries', name: 'Weekend Grocery Pack', vendorId: 'reliance', units: 1880, revenue: 1425000, district: 'Kollam' },
  { id: 'fashion', name: 'Myntra Fashion Cart', vendorId: 'myntra', units: 1530, revenue: 1760000, district: 'Malappuram' }
];

const districtSales = [
  { district: 'Ernakulam', revenue: 3180000 },
  { district: 'Thiruvananthapuram', revenue: 2610000 },
  { district: 'Kozhikode', revenue: 2380000 },
  { district: 'Thrissur', revenue: 2270000 },
  { district: 'Kollam', revenue: 1960000 },
  { district: 'Kannur', revenue: 1820000 },
  { district: 'Malappuram', revenue: 1750000 }
];

const money = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export default function AdminPage() {
  const [selectedProductId, setSelectedProductId] = useState(products[0].id);
  const [paidVendors, setPaidVendors] = useState({});
  const [message, setMessage] = useState('');

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === selectedProductId),
    [selectedProductId]
  );

  const productVendor = useMemo(
    () => vendors.find((vendor) => vendor.id === selectedProduct?.vendorId),
    [selectedProduct]
  );

  const commissionBreakdown = useMemo(() => {
    if (!selectedProduct) return [];
    return vendors.map((vendor) => {
      const baseShare = vendor.id === selectedProduct.vendorId ? 0.54 : 0.0657;
      const revenueShare = Math.round(selectedProduct.revenue * baseShare);
      const commission = Math.round(revenueShare * vendor.commissionRate);
      return {
        ...vendor,
        revenueShare,
        commission,
        payable: revenueShare - commission
      };
    });
  }, [selectedProduct]);

  const mostSoldProduct = useMemo(
    () => [...products].sort((a, b) => b.units - a.units)[0],
    []
  );

  const mostSoldDistrict = useMemo(
    () => [...districtSales].sort((a, b) => b.revenue - a.revenue)[0],
    []
  );

  const totalRevenue = useMemo(
    () => products.reduce((sum, item) => sum + item.revenue, 0),
    []
  );

  const payVendor = (vendorId) => {
    setPaidVendors((prev) => ({ ...prev, [vendorId]: true }));
    const vendor = vendors.find((item) => item.id === vendorId);
    setMessage(`Payment initiated for ${vendor?.name || 'vendor'}.`);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-orange-100 bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 p-6 text-white shadow-2xl">
        <h1 className="text-3xl font-extrabold md:text-4xl">🛡 OffeyrDeals Command Center</h1>
        <p className="mt-2 text-sm md:text-base">Vendor network, Kerala sales intelligence, and commission payouts in one dashboard.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/20 p-3 backdrop-blur"><p className="text-xs uppercase">Total Revenue</p><p className="text-xl font-bold">{money(totalRevenue)}</p></div>
          <div className="rounded-2xl bg-white/20 p-3 backdrop-blur"><p className="text-xs uppercase">Most Sold Product</p><p className="text-xl font-bold">{mostSoldProduct.name}</p></div>
          <div className="rounded-2xl bg-white/20 p-3 backdrop-blur"><p className="text-xs uppercase">Top District (Kerala)</p><p className="text-xl font-bold">{mostSoldDistrict.district}</p></div>
        </div>
      </section>

      <section className="glass-card p-5">
        <h2 className="mb-4 text-xl font-bold">🏬 Vendor Partners</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {vendors.map((vendor) => (
            <article key={vendor.id} className="rounded-2xl border border-orange-100 bg-white p-3 shadow-sm">
              <img src={vendor.logo} alt={vendor.name} className="h-12 w-24 object-contain" />
              <h3 className="mt-2 text-sm font-bold">{vendor.name}</h3>
              <p className="text-xs text-slate-500">Commission: {(vendor.commissionRate * 100).toFixed(0)}%</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="glass-card p-5">
          <h2 className="text-xl font-bold">📈 Kerala District Sales Chart</h2>
          <div className="mt-4 space-y-3">
            {districtSales.map((item) => (
              <div key={item.district}>
                <div className="mb-1 flex justify-between text-xs font-semibold">
                  <span>{item.district}</span>
                  <span>{money(item.revenue)}</span>
                </div>
                <div className="h-3 rounded-full bg-orange-100">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                    style={{ width: `${Math.round((item.revenue / mostSoldDistrict.revenue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-card p-5">
          <h2 className="text-xl font-bold">🧾 Product Revenue Drilldown</h2>
          <div className="mt-4 grid gap-2">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                className={`rounded-xl border p-3 text-left ${
                  selectedProductId === product.id
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-orange-100 bg-white'
                }`}
              >
                <p className="font-semibold">{product.name}</p>
                <p className="text-xs text-slate-500">{money(product.revenue)} | {product.units} sold</p>
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="glass-card p-5">
        <h2 className="text-xl font-bold">💰 Commission Split & Vendor Payout</h2>
        {selectedProduct && (
          <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm">
            Selected: <b>{selectedProduct.name}</b> ({productVendor?.name}) | Revenue: <b>{money(selectedProduct.revenue)}</b>
          </div>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2">Vendor</th>
                <th className="pb-2">Revenue Share</th>
                <th className="pb-2">Commission</th>
                <th className="pb-2">Payable</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {commissionBreakdown.map((row) => (
                <tr key={row.id} className="border-b border-orange-50">
                  <td className="py-2 font-semibold">{row.name}</td>
                  <td className="py-2">{money(row.revenueShare)}</td>
                  <td className="py-2 text-rose-600">- {money(row.commission)}</td>
                  <td className="py-2 text-emerald-700">{money(row.payable)}</td>
                  <td className="py-2">
                    <button
                      onClick={() => payVendor(row.id)}
                      disabled={Boolean(paidVendors[row.id])}
                      className="rounded-lg bg-slate-900 px-3 py-1 text-white disabled:opacity-40"
                    >
                      {paidVendors[row.id] ? 'Paid' : 'Pay Vendor'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {message && <p className="mt-3 rounded-lg bg-slate-100 p-2 text-sm">{message}</p>}
      </section>
    </div>
  );
}
