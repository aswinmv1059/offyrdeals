import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [otp, setOtp] = useState('');
  const [needsOtp, setNeedsOtp] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', form);
      login(response.data);
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      if (message.toLowerCase().includes('otp not verified')) {
        setNeedsOtp(true);
      }
    }
  };

  const verifyOtpAndLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/verify-otp', { email: form.identifier, otp });
      const response = await api.post('/auth/login', form);
      login(response.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    }
  };

  const resendOtp = async () => {
    setError('');
    setResending(true);
    try {
      const response = await api.post('/auth/resend-otp', { email: form.identifier });
      setError(`OTP (simulation): ${response.data.otp_simulation}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-wrap grid min-h-screen place-items-center px-4 py-8">
      <div className="glass-card w-full max-w-md p-6 md:p-8">
        <h1 className="mb-1 text-3xl font-extrabold text-white">Welcome Back 👋</h1>
        <p className="mb-5 text-sm text-orange-100">Sign in to unlock nearby exclusive deals.</p>
        {error && <p className="mb-3 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}
        <form className="space-y-3" onSubmit={handleSubmit}>
          <input className="input-field" placeholder="Email or username" required value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} />
          <input className="input-field" placeholder="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="primary-btn w-full" type="submit">Login</button>
        </form>
        {needsOtp && (
          <form className="mt-4 space-y-3" onSubmit={verifyOtpAndLogin}>
            <input className="input-field" placeholder="6-digit OTP" required value={otp} onChange={(e) => setOtp(e.target.value)} />
            <button className="primary-btn w-full" type="submit">Verify OTP & Continue</button>
            <button className="w-full rounded-xl border border-white/60 bg-white/20 px-4 py-3 font-semibold text-white" type="button" onClick={resendOtp} disabled={resending}>
              {resending ? 'Resending...' : 'Resend OTP'}
            </button>
          </form>
        )}
        <p className="mt-4 text-sm text-white">No account? <Link to="/register" className="font-semibold text-orange-200 underline">Register</Link></p>
      </div>
    </div>
  );
}
