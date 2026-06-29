'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { authService } from '@/services/auth';
import { Pill } from 'lucide-react';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    // Google returns the token in the URL hash: #id_token=...
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('id_token') || params.get('access_token');

    if (!accessToken) {
      setError('No token received from Google. Please try again.');
      setTimeout(() => router.push('/auth'), 3000);
      return;
    }

    // Send the Google token to your Django backend
    api.googleLogin(accessToken)
      .then((data) => {
        const d = data as { access: string; refresh: string; user: { role: string; username: string; email: string } };
        authService.saveTokens(d.access, d.refresh, d.user);
        if (d.user.role === 'customer') sessionStorage.setItem('just_logged_in', '1');
        router.push('/');
      })
      .catch((err) => {
        setError(err.message || 'Google login failed. Please try again.');
        setTimeout(() => router.push('/auth'), 3000);
      });
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#f0fdfa,#dcfce7)', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#0d9488,#16a34a)', borderRadius: 16, padding: '14px', display: 'inline-flex' }}>
        <Pill size={28} color="white" />
      </div>

      {error ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ef4444', fontWeight: 600, marginBottom: '.5rem' }}>{error}</p>
          <p style={{ color: '#6b8f84', fontSize: '.875rem' }}>Redirecting back to login...</p>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: '.3rem', justifyContent: 'center', marginBottom: '1rem' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#0d9488', animation: `pulse 1.2s ${i * 0.2}s infinite` }} />
            ))}
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: '#0a1a16' }}>Signing you in with Google...</p>
          <p style={{ color: '#6b8f84', fontSize: '.875rem', marginTop: '.3rem' }}>Please wait a moment</p>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: .3; transform: scale(.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}