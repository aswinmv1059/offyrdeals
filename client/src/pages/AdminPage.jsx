import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const base = import.meta.env.BASE_URL;

const vendors = [
  { id: 'kfc', name: 'KFC', logo: `${base}vendor-logos/kfc.svg`, commissionRate: 0.14 },
  { id: 'decathlon', name: 'Decathlon', logo: `${base}vendor-logos/decathlon.svg`, commissionRate: 0.11 },
  { id: 'zomato', name: 'Zomato', logo: `${base}vendor-logos/zomato.svg`, commissionRate: 0.16 },
  { id: 'swiggy', name: 'Swiggy', logo: `${base}vendor-logos/swiggy.svg`, commissionRate: 0.15 },
  { id: 'dominos', name: "Domino's", logo: `${base}vendor-logos/dominos.svg`, commissionRate: 0.13 },
  { id: 'mcd', name: "McDonald's", logo: `${base}vendor-logos/mcd.svg`, commissionRate: 0.12 },
  { id: 'reliance', name: 'Reliance Smart', logo: `${base}vendor-logos/reliance.svg`, commissionRate: 0.1 },
  { id: 'myntra', name: 'Myntra', logo: `${base}vendor-logos/myntra.svg`, commissionRate: 0.12 }
];

const initialProducts = [
  { id: 'bucket', name: 'KFC Bucket Meal', vendorId: 'kfc', units: 2890, revenue: 1860000, district: 'Ernakulam', actualPrice: 699, discountedPrice: 529, couponPrice: 40, image: `${base}vendor-logos/kfc.svg` },
  { id: 'shoes', name: 'Running Shoes', vendorId: 'decathlon', units: 1630, revenue: 2240000, district: 'Thiruvananthapuram', actualPrice: 2499, discountedPrice: 1999, couponPrice: 70, image: `${base}vendor-logos/decathlon.svg` },
  { id: 'combo', name: 'Zomato Combo Offer', vendorId: 'zomato', units: 3980, revenue: 1985000, district: 'Kozhikode', actualPrice: 499, discountedPrice: 349, couponPrice: 30, image: `${base}vendor-logos/zomato.svg` },
  { id: 'instamart', name: 'Swiggy Instamart Basket', vendorId: 'swiggy', units: 2450, revenue: 1320000, district: 'Ernakulam', actualPrice: 899, discountedPrice: 699, couponPrice: 35, image: `${base}vendor-logos/swiggy.svg` }
];

const districtSales = [
  { district: 'Ernakulam', revenue: 3180000 },
  { district: 'Thiruvananthapuram', revenue: 2610000 },
  { district: 'Kozhikode', revenue: 2380000 },
  { district: 'Thrissur', revenue: 2270000 },
  { district: 'Kollam', revenue: 1960000 }
];

const money = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState(initialProducts);
  const [selectedVendorId, setSelectedVendorId] = useState(vendors[0].id);
  const [selectedProductId, setSelectedProductId] = useState(initialProducts[0].id);
  const [message, setMessage] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    image: '',
    actualPrice: '',
    discountedPrice: '',
    couponPrice: ''
  });

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load users');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => vendor.id === selectedVendorId),
    [selectedVendorId]
  );

  const vendorProducts = useMemo(
    () => products.filter((product) => product.vendorId === selectedVendorId),
    [products, selectedVendorId]
  );

  useEffect(() => {
    if (vendorProducts.length > 0) setSelectedProductId(vendorProducts[0].id);
  }, [selectedVendorId]);

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === selectedProductId),
    [products, selectedProductId]
  );

  const totalRevenue = useMemo(
    () => products.reduce((sum, item) => sum + item.revenue, 0),
    [products]
  );

  const mostSoldProduct = useMemo(
    () => [...products].sort((a, b) => b.units - a.units)[0],
    [products]
  );

  const mostSoldDistrict = useMemo(
    () => [...districtSales].sort((a, b) => b.revenue - a.revenue)[0],
    []
  );

  const commissionBreakdown = useMemo(() => {
    if (!selectedProduct) return [];
    return vendors.map((vendor) => {
      const baseShare = vendor.id === selectedProduct.vendorId ? 0.56 : 0.062;
      const revenueShare = Math.round(selectedProduct.revenue * baseShare);
      const commission = Math.round(revenueShare * vendor.commissionRate);
      return { ...vendor, revenueShare, commission, payable: revenueShare - commission };
    });
  }, [selectedProduct]);

  const updatePrivilege = async (userId, role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      setMessage(`Privilege updated to ${role}`);
      await loadUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update privilege');
    }
  };

  const onUploadImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setNewProduct((prev) => ({ ...prev, image: url }));
  };

  const addProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.actualPrice || !newProduct.discountedPrice || !newProduct.couponPrice) {
      setMessage('Please fill all product fields.');
      return;
    }
    const actual = Number(newProduct.actualPrice);
    const discount = Number(newProduct.discountedPrice);
    const coupon = Number(newProduct.couponPrice);
    const revenue = Math.round((discount + coupon) * 600);
    const created = {
      id: `p_${Date.now()}`,
      name: newProduct.name,
      vendorId: selectedVendorId,
      units: 600,
      revenue,
      district: 'Ernakulam',
      actualPrice: actual,
      discountedPrice: discount,
      couponPrice: coupon,
      image: newProduct.image || selectedVendor.logo
    };
    setProducts((prev) => [created, ...prev]);
    setSelectedProductId(created.id);
    setNewProduct({ name: '', image: '', actualPrice: '', discountedPrice: '', couponPrice: '' });
    setMessage(`Added product "${created.name}" for ${selectedVendor.name}`);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-sky-100 bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-500 p-6 text-white shadow-2xl">
        <h1 className="text-3xl font-extrabold md:text-4xl">📊 OffyrDeals Intelligence Hub</h1>
        <p className="mt-2 text-sm md:text-base">Sales, vendor payouts, products, and privilege control in one admin cockpit.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/20 p-3 backdrop-blur"><p className="text-xs uppercase">Total Revenue</p><p className="text-xl font-bold">{money(totalRevenue)}</p></div>
          <div className="rounded-2xl bg-white/20 p-3 backdrop-blur"><p className="text-xs uppercase">Most Sold Product</p><p className="text-xl font-bold">{mostSoldProduct?.name || '-'}</p></div>
          <div className="rounded-2xl bg-white/20 p-3 backdrop-blur"><p className="text-xs uppercase">Top District</p><p className="text-xl font-bold">{mostSoldDistrict.district}</p></div>
        </div>
      </section>

      {message && <p className="rounded-xl bg-slate-100 p-3 text-sm">{message}</p>}

      <section className="glass-card p-5">
        <h2 className="mb-4 text-xl font-bold">👥 Review Users & Privilege</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2">User ID</th>
                <th className="pb-2">Name</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Privilege</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-sky-50">
                  <td className="py-2 font-mono text-xs">{user._id}</td>
                  <td className="py-2">{user.name}</td>
                  <td className="py-2">{user.email}</td>
                  <td className="py-2">
                    <select
                      className="rounded border border-sky-200 p-1"
                      value={user.role === 'ADMIN' ? 'VENDOR' : user.role}
                      onChange={(e) => updatePrivilege(user._id, e.target.value)}
                    >
                      <option value="USER">Normal User</option>
                      <option value="VENDOR">Vendor</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-card p-5">
        <h2 className="mb-4 text-xl font-bold">🏬 Vendor List</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {vendors.map((vendor) => (
            <button
              key={vendor.id}
              onClick={() => setSelectedVendorId(vendor.id)}
              className={`rounded-2xl border p-3 text-left shadow-sm ${
                selectedVendorId === vendor.id ? 'border-sky-500 bg-sky-50' : 'border-sky-100 bg-white'
              }`}
            >
              <img src={vendor.logo} alt={vendor.name} className="h-12 w-24 object-contain" />
              <h3 className="mt-2 text-sm font-bold">{vendor.name}</h3>
              <p className="text-xs text-slate-500">Commission: {(vendor.commissionRate * 100).toFixed(0)}%</p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="glass-card p-5">
          <h2 className="text-xl font-bold">🧾 {selectedVendor?.name} Products</h2>
          <div className="mt-4 space-y-2">
            {vendorProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                className={`w-full rounded-xl border p-3 text-left ${
                  selectedProductId === product.id ? 'border-sky-400 bg-sky-50' : 'border-sky-100 bg-white'
                }`}
              >
                <p className="font-semibold">{product.name}</p>
                <p className="text-xs text-slate-500">{money(product.revenue)} | {product.units} sold</p>
              </button>
            ))}
          </div>
        </article>

        <article className="glass-card p-5">
          <h2 className="text-xl font-bold">➕ Add Product (Selected Vendor)</h2>
          <form className="mt-4 space-y-3" onSubmit={addProduct}>
            <input className="input-field" placeholder="Product Name" value={newProduct.name} onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))} />
            <input className="input-field" type="number" placeholder="Actual Price" value={newProduct.actualPrice} onChange={(e) => setNewProduct((prev) => ({ ...prev, actualPrice: e.target.value }))} />
            <input className="input-field" type="number" placeholder="Discounted Price" value={newProduct.discountedPrice} onChange={(e) => setNewProduct((prev) => ({ ...prev, discountedPrice: e.target.value }))} />
            <input className="input-field" type="number" placeholder="Coupon Purchase Price" value={newProduct.couponPrice} onChange={(e) => setNewProduct((prev) => ({ ...prev, couponPrice: e.target.value }))} />
            <input className="input-field" type="file" accept="image/*" onChange={onUploadImage} />
            <button className="primary-btn w-full" type="submit">Add Product</button>
          </form>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="glass-card p-5">
          <h2 className="text-xl font-bold">📈 Kerala District Sales</h2>
          <div className="mt-4 space-y-3">
            {districtSales.map((item) => (
              <div key={item.district}>
                <div className="mb-1 flex justify-between text-xs font-semibold"><span>{item.district}</span><span>{money(item.revenue)}</span></div>
                <div className="h-3 rounded-full bg-sky-100">
                  <div className="h-3 rounded-full bg-gradient-to-r from-sky-500 to-teal-500" style={{ width: `${Math.round((item.revenue / mostSoldDistrict.revenue) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-card p-5">
          <h2 className="text-xl font-bold">💰 Revenue & Commission Split</h2>
          {selectedProduct && (
            <div className="mt-3 rounded-xl border border-teal-100 bg-teal-50 p-3 text-sm">
              Product: <b>{selectedProduct.name}</b><br />
              Actual: <b>{money(selectedProduct.actualPrice)}</b> | Discounted: <b>{money(selectedProduct.discountedPrice)}</b> | Coupon: <b>{money(selectedProduct.couponPrice)}</b><br />
              Revenue Generated: <b>{money(selectedProduct.revenue)}</b>
            </div>
          )}
          <div className="mt-3 overflow-x-auto">
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
                  <tr key={row.id} className="border-b border-sky-50">
                    <td className="py-2">{row.name}</td>
                    <td>{money(row.revenueShare)}</td>
                    <td className="text-rose-600">- {money(row.commission)}</td>
                    <td className="text-emerald-700">{money(row.payable)}</td>
                    <td><button className="rounded-lg bg-slate-900 px-3 py-1 text-white">Pay Vendor</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
