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
    <div className="auth-wrap grid min-h-screen place-items-center px-4 py-8">
      <div className="glass-card w-full max-w-md p-6 md:p-8">
        <h1 className="mb-1 text-3xl font-extrabold text-white">Welcome Back 👋</h1>
        <p className="mb-5 text-sm text-orange-100">Sign in to unlock nearby exclusive deals.</p>
        {error && <p className="mb-3 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}
        <form className="space-y-3" onSubmit={handleSubmit}>
          <input className="input-field" placeholder="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input-field" placeholder="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="primary-btn w-full" type="submit">Login</button>
        </form>
        <p className="mt-4 text-sm text-white">No account? <Link to="/register" className="font-semibold text-orange-200 underline">Register</Link></p>
      </div>
    </div>
  );
}
