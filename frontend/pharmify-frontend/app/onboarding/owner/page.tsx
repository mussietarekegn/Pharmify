'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { authService } from '@/services/auth';
import { Store, MapPin, Upload, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function OwnerOnboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  const [form, setForm] = useState({
    name: '',
    location: '',
  });

  useEffect(() => {
    if (!authService.isLoggedIn()) {
      router.push('/auth');
      return;
    }
    const user = authService.getUser();
    if (user?.role !== 'owner') {
      router.push('/');
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn('Location access denied', err)
      );
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Please upload your pharmacy license document.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = authService.getAccess();
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('location', form.location);
      formData.append('license_document', file);
      if (coords) {
        formData.append('latitude', coords.lat.toString());
        formData.append('longitude', coords.lng.toString());
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pharmacies/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to create pharmacy profile.');
      }

      setSuccess(true);
      // Redirect to owner dashboard - it will show 'waiting for approval' since not verified yet
      setTimeout(() => {
        router.push('/dashboard/owner');
      }, 2500);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during onboarding.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-color)' }}>
        <div className="animate-fadeUp" style={{ background: 'var(--surface)', padding: '3rem', borderRadius: '24px', textAlign: 'center', maxWidth: 500, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'inline-flex', background: '#fef3c7', padding: '1.25rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
            <CheckCircle2 size={52} color="#d97706" />
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-main)' }}>Application Submitted!</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '0.5rem' }}>
            Your pharmacy has been registered and is now <strong>pending admin verification</strong>.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            The admin will review your license document. Once approved, you will be able to post medicines and manage your pharmacy. Redirecting you now…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="animate-fadeUp" style={{ background: 'var(--surface)', borderRadius: '24px', padding: '3rem', width: '100%', maxWidth: 540, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(15,157,88,0.1)', padding: '1rem', borderRadius: '16px', marginBottom: '1rem' }}>
            <Store size={32} color="var(--brand)" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Pharmacy Setup</h1>
          <p style={{ color: 'var(--text-muted)' }}>We need a few details to get your pharmacy online.</p>
        </div>

        {error && (
          <div className="animate-fadeIn" style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#991b1b', fontSize: '0.9rem' }}>
            <AlertCircle size={20} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>Pharmacy Name</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Store size={18} />
              </span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="input-premium"
                style={{ paddingLeft: '3rem' }}
                placeholder="e.g. City Health Pharmacy"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>Location</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <MapPin size={18} />
              </span>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                className="input-premium"
                style={{ paddingLeft: '3rem' }}
                placeholder="e.g. Bole, Addis Ababa"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>License Document</label>
            <label style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
              border: '2px dashed var(--border-light)', borderRadius: '16px', padding: '2rem 1rem', 
              cursor: 'pointer', transition: 'all 0.2s', background: 'var(--bg-color)' 
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
            >
              <Upload size={32} color={file ? "var(--brand)" : "var(--text-muted)"} style={{ marginBottom: '1rem' }} />
              <span style={{ fontSize: '0.95rem', fontWeight: 500, color: file ? 'var(--brand)' : 'var(--text-main)', textAlign: 'center' }}>
                {file ? file.name : 'Click to upload document'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>PDF, JPG, PNG up to 5MB</span>
              <input 
                type="file" 
                accept=".pdf,image/png,image/jpeg"
                onChange={e => setFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
                required
              />
            </label>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '1rem', padding: '1rem' }}>
            {loading ? <span className="spinner" /> : <>Complete Setup <ArrowRight size={18} /></>}
          </button>
        </form>

      </div>
    </div>
  );
}
