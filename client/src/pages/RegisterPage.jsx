import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [otpHint, setOtpHint] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/register', form);
      setOtpHint(response.data.otp_simulation || 'OTP generated');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-md rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-bold">Register</h1>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {otpHint && <p className="mb-3 text-sm text-green-700">OTP (simulation): {otpHint}</p>}
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input className="w-full rounded border p-2" placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="w-full rounded border p-2" placeholder="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="w-full rounded border p-2" placeholder="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="w-full rounded border p-2" placeholder="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="w-full rounded bg-slate-900 p-2 text-white" type="submit">Register</button>
      </form>
      <p className="mt-4 text-sm">Already registered? <Link to="/login" className="font-semibold">Login</Link></p>
    </div>
  );
}
