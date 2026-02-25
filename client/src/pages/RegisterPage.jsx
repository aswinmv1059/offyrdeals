import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '+91', password: '' });
  const [otpHint, setOtpHint] = useState('');
  const [otpMode, setOtpMode] = useState('simulation');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('register');
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const logoSrc = `${import.meta.env.BASE_URL}offeyr-logo-mark.svg`;
  const extractError = (err, fallback) =>
    err?.response?.data?.message ||
    err?.response?.data?.errors?.[0]?.msg ||
    fallback;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/register', form);
      setOtpMode(response.data.otp_mode || 'simulation');
      setOtpHint(response.data.otp_simulation || '');
      setStep('verify');
    } catch (err) {
      setError(extractError(err, 'Registration failed'));
    }
  };

  const handleVerifyAndLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/verify-otp', { phone: form.phone, otp });
      const loginResponse = await api.post('/auth/login', {
        identifier: form.email,
        password: form.password
      });
      login(loginResponse.data);
      navigate('/dashboard');
    } catch (err) {
      setError(extractError(err, 'OTP verification failed'));
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setResending(true);
    try {
      const response = await api.post('/auth/resend-otp', { phone: form.phone });
      setOtpMode(response.data.otp_mode || 'simulation');
      setOtpHint(response.data.otp_simulation || '');
    } catch (err) {
      setError(extractError(err, 'Failed to resend OTP'));
    } finally {
      setResending(false);
    }
  };

  const handlePhoneChange = (value) => {
    const digitsOnly = value.replace(/\D/g, '');
    let local = digitsOnly;
    if (local.startsWith('91')) {
      local = local.slice(2);
    }
    local = local.slice(0, 10);
    setForm((prev) => ({ ...prev, phone: `+91${local}` }));
  };

  return (
    <div className="auth-wrap grid min-h-screen place-items-center px-4 py-8">
      <div className="glass-card liquid-glass smooth-rise w-full max-w-md p-6 md:p-8">
        <img src={logoSrc} alt="OffyrDeals" className="smooth-rise mb-4 h-14 w-auto" />
        <h1 className="mb-1 text-3xl font-extrabold text-white">
          {step === 'register' ? 'Create Account 🎉' : 'Verify OTP 🔐'}
        </h1>
        <p className="mb-5 text-sm text-orange-100">
          {step === 'register'
            ? 'Register and verify OTP to continue.'
            : 'Enter the OTP to activate and login.'}
        </p>
        {step === 'register' && (
          <p className="mb-3 rounded bg-sky-100 p-2 text-xs text-sky-800">
            OTP is in simulation mode here. After Register, you will see a 6-digit OTP on this screen.
          </p>
        )}
        {error && <p className="mb-3 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}
        {step === 'verify' && otpMode === 'sms' && (
          <p className="mb-3 rounded bg-emerald-100 p-2 text-sm text-emerald-700">
            OTP sent to your phone number. Enter it below.
          </p>
        )}
        {otpMode !== 'sms' && otpHint && (
          <p className="mb-3 rounded bg-emerald-100 p-2 text-sm text-emerald-700">
            OTP (simulation): <span className="font-mono font-bold">{otpHint}</span>
          </p>
        )}
        {step === 'register' ? (
          <form className="space-y-3" onSubmit={handleRegister}>
            <input className="input-field" placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input-field" placeholder="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input
              className="input-field"
              placeholder="+91XXXXXXXXXX"
              required
              pattern="^\+91[6-9][0-9]{9}$"
              value={form.phone}
              onFocus={() => {
                if (!form.phone) setForm((prev) => ({ ...prev, phone: '+91' }));
              }}
              onChange={(e) => handlePhoneChange(e.target.value)}
            />
            <input className="input-field" placeholder="Password (min 6 chars)" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button className="primary-btn smooth-rise w-full" type="submit">Register</button>
          </form>
        ) : (
          <form className="space-y-3" onSubmit={handleVerifyAndLogin}>
            <input className="input-field" placeholder="Phone" value={form.phone} readOnly />
            <input className="input-field" placeholder="6-digit OTP" required value={otp} onChange={(e) => setOtp(e.target.value)} />
            <button className="primary-btn smooth-rise w-full" type="submit">Verify OTP & Login</button>
            <button className="w-full rounded-xl border border-white/60 bg-white/20 px-4 py-3 font-semibold text-white" type="button" onClick={handleResendOtp} disabled={resending}>
              {resending ? 'Resending...' : 'Resend OTP'}
            </button>
          </form>
        )}
        <p className="mt-4 text-sm text-white">Already registered? <Link to="/login" className="font-semibold text-orange-200 underline">Login</Link></p>
      </div>
    </div>
  );
}
