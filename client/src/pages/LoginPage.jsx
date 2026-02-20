import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', form);
      login(response.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-md rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-bold">Login</h1>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input className="w-full rounded border p-2" placeholder="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="w-full rounded border p-2" placeholder="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="w-full rounded bg-slate-900 p-2 text-white" type="submit">Login</button>
      </form>
      <p className="mt-4 text-sm">No account? <Link to="/register" className="font-semibold">Register</Link></p>
    </div>
  );
}
