'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { authService } from '@/services/auth';
import { Eye, EyeOff, Pill, Mail, Lock, User, Phone, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'customer',
    phone: '',
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const data = await api.register({
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
          phone: form.phone,
        }) as { access: string; refresh: string; user: { role: string; username: string; email: string } };

        authService.saveTokens(data.access, data.refresh, data.user);
        
        if (data.user.role === 'admin') {
          window.location.href = '/dashboard/admin';
        } else if (data.user.role === 'owner') {
          // Send to onboarding right after registration
          window.location.href = '/onboarding/owner';
        } else {
          sessionStorage.setItem('just_logged_in', '1');
          window.location.href = '/dashboard/customer';
        }

      } else {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL!.replace('/api', '')}/api/token/`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: form.username,
              password: form.password,
            }),
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.detail || 'Invalid username or password');
        }

        const tokens = await res.json() as { access: string; refresh: string };
        const payload = JSON.parse(atob(tokens.access.split('.')[1]));

        const user = {
          id: payload.user_id,
          username: form.username,
          email: '',
          role: payload.role || 'customer',
          phone: '',
        };

        authService.saveTokens(tokens.access, tokens.refresh, user);
        
        if (user.role === 'admin') {
          window.location.href = '/dashboard/admin';
        } else if (user.role === 'owner') {
          window.location.href = '/dashboard/owner';
        } else {
          sessionStorage.setItem('just_logged_in', '1');
          window.location.href = '/dashboard/customer';
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="animate-fadeUp" style={{ background: 'var(--surface)', borderRadius: '24px', padding: '3rem 2.5rem', width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--brand), #10b981)', borderRadius: '16px', padding: '14px', display: 'inline-flex', marginBottom: '1.25rem', boxShadow: '0 8px 16px rgba(15,157,88,0.2)' }}>
            <Pill size={32} color="white" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-main)' }}>Pharmify</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
            {mode === 'login' ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-color)', borderRadius: '14px', padding: '4px', marginBottom: '2rem' }}>
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s ease',
                background: mode === m ? 'var(--surface)' : 'transparent',
                color: mode === m ? 'var(--brand)' : 'var(--text-muted)',
                boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {error && (
          <div className="animate-fadeIn" style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#991b1b', fontSize: '0.9rem' }}>
            <AlertCircle size={20} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {mode === 'register' && (
            <>
              <Field icon={<Mail size={18} />} label="Email" type="email" value={form.email} onChange={(v) => update('email', v)} placeholder="you@example.com" />
              <Field icon={<Phone size={18} />} label="Phone" type="tel" value={form.phone} onChange={(v) => update('phone', v)} placeholder="+251..." required={false} />
              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>Account Type</label>
                <select
                  value={form.role}
                  onChange={(e) => update('role', e.target.value)}
                  className="input-premium"
                >
                  <option value="customer">Customer</option>
                  <option value="owner">Pharmacy Owner</option>
                </select>
              </div>
            </>
          )}

          <Field icon={<User size={18} />} label="Username" value={form.username} onChange={(v) => update('username', v)} placeholder="Enter your username" />

          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="••••••••"
                required
                className="input-premium"
                style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '0.5rem' }}>
            {loading
              ? <span className="spinner" />
              : mode === 'login' ? 'Sign In' : 'Create Account'
            }
          </button>
        </form>

        <div style={{ position: 'relative', margin: '2rem 0', textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid var(--border-light)', position: 'absolute', top: '50%', left: 0, right: 0 }} />
          <span style={{ background: 'var(--surface)', position: 'relative', padding: '0 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>or continue with</span>
        </div>

        <GoogleButton />
      </div>
    </div>
  );
}

function Field({
  icon, label, type = 'text', value, onChange, placeholder, required = true,
}: {
  icon: React.ReactNode;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div>
      <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="input-premium"
          style={{ paddingLeft: '3rem' }}
        />
      </div>
    </div>
  );
}

function GoogleButton() {
  function handleGoogle() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    if (!clientId) {
      alert('Google Client ID not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local');
      return;
    }
    const redirect = encodeURIComponent(window.location.origin + '/auth/google-callback');
    const nonce = Math.random().toString(36).substring(2);
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirect}&response_type=id_token&scope=email%20profile%20openid&nonce=${nonce}`;
  }

  return (
    <button
      onClick={handleGoogle}
      type="button"
      className="btn-secondary"
      style={{ width: '100%', padding: '0.85rem' }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      Continue with Google
    </button>
  );
}