import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [otp, setOtp] = useState('');
  const [needsOtp, setNeedsOtp] = useState(false);
  const [resending, setResending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const logoSrc = `${import.meta.env.BASE_URL}offeyr-logo-mark.svg`;
  const applyQuickAccount = (identifier, password) => setForm({ identifier, password });

  const extractErrorMessage = (err, fallback) => {
    return (
      err?.response?.data?.message ||
      err?.response?.data?.errors?.[0]?.msg ||
      err?.message ||
      fallback
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      let response;
      try {
        response = await api.post('/auth/login', form);
      } catch (loginError) {
        const isDefaultAccount =
          (form.identifier === 'admin' && form.password === 'admin') ||
          (form.identifier === 'user' && form.password === 'user') ||
          (form.identifier === 'vendor' && form.password === 'vendor');

        if (!isDefaultAccount) throw loginError;

        const bootstrapRoute =
          form.identifier === 'admin'
            ? '/auth/admin-bootstrap-login'
            : form.identifier === 'vendor'
              ? '/auth/vendor-bootstrap-login'
              : '/auth/user-bootstrap-login';

        try {
          response = await api.post(bootstrapRoute, form);
        } catch (bootstrapError) {
          // Keep normal login error if fallback route is missing on an older backend deploy.
          if (bootstrapError?.response?.status === 404) {
            throw loginError;
          }
          throw bootstrapError;
        }
      }
      login(response.data);
      try {
        await api.get('/auth/me');
      } catch (sessionError) {
        logout();
        throw new Error(
          extractErrorMessage(
            sessionError,
            'Login succeeded but session verification failed. Please try again.'
          )
        );
      }
      const role = response.data?.user?.role;
      const nextPath = role === 'ADMIN' ? '/admin' : role === 'VENDOR' ? '/vendor' : '/dashboard';
      navigate(nextPath);
    } catch (err) {
      const message = extractErrorMessage(err, 'Login failed');
      setError(message);
      if (message.toLowerCase().includes('otp not verified')) {
        setNeedsOtp(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtpAndLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/auth/verify-otp', { email: form.identifier, otp });
      const response = await api.post('/auth/login', form);
      login(response.data);
      try {
        await api.get('/auth/me');
      } catch (sessionError) {
        logout();
        throw new Error(
          extractErrorMessage(
            sessionError,
            'OTP verified, but session verification failed. Please try again.'
          )
        );
      }
      const role = response.data?.user?.role;
      const nextPath = role === 'ADMIN' ? '/admin' : role === 'VENDOR' ? '/vendor' : '/dashboard';
      navigate(nextPath);
    } catch (err) {
      setError(extractErrorMessage(err, 'OTP verification failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const resendOtp = async () => {
    setError('');
    setResending(true);
    try {
      const response = await api.post('/auth/resend-otp', { email: form.identifier });
      setError(`OTP (simulation): ${response.data.otp_simulation}`);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to resend OTP'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-wrap grid min-h-screen place-items-center px-4 py-8">
      <div className="glass-card liquid-glass smooth-rise w-full max-w-md p-6 md:p-8">
        <img src={logoSrc} alt="OffyrDeals" className="smooth-rise mb-4 h-14 w-auto" />
        <h1 className="mb-1 text-3xl font-extrabold text-slate-900">Welcome Back 👋</h1>
        <p className="mb-5 text-sm text-slate-700">Sign in to unlock nearby exclusive deals.</p>
        {error && <p className="mb-3 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}
        <form className="space-y-3" onSubmit={handleSubmit}>
          <input className="input-field" placeholder="Email or username" required value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} />
          <input className="input-field" placeholder="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="primary-btn smooth-rise w-full" type="submit" disabled={submitting}>
            {submitting ? 'Please wait...' : 'Login'}
          </button>
        </form>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <button type="button" onClick={() => applyQuickAccount('user', 'user')} className="rounded-lg border border-slate-300 bg-white px-2 py-2 font-semibold text-slate-800">User</button>
          <button type="button" onClick={() => applyQuickAccount('vendor', 'vendor')} className="rounded-lg border border-slate-300 bg-white px-2 py-2 font-semibold text-slate-800">Vendor</button>
          <button type="button" onClick={() => applyQuickAccount('admin', 'admin')} className="rounded-lg border border-slate-300 bg-white px-2 py-2 font-semibold text-slate-800">Admin</button>
        </div>
        {needsOtp && (
          <form className="mt-4 space-y-3" onSubmit={verifyOtpAndLogin}>
            <input className="input-field" placeholder="6-digit OTP" required value={otp} onChange={(e) => setOtp(e.target.value)} />
            <button className="primary-btn smooth-rise w-full" type="submit" disabled={submitting}>
              {submitting ? 'Please wait...' : 'Verify OTP & Continue'}
            </button>
            <button className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800" type="button" onClick={resendOtp} disabled={resending}>
              {resending ? 'Resending...' : 'Resend OTP'}
            </button>
          </form>
        )}
        <p className="mt-4 text-sm text-slate-800">No account? <Link to="/register" className="font-semibold text-blue-700 underline">Register</Link></p>
      </div>
    </div>
  );
}
