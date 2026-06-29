'use client';
import { useState } from 'react';
import { MapPin, X, Navigation } from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  onClose: () => void;
}

export default function LocationModal({ onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  async function requestLocation() {
    setLoading(true);
    if (!navigator.geolocation) {
      await api.updateLocation(9.032, 38.7469);
      onClose();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await api.updateLocation(pos.coords.latitude, pos.coords.longitude).catch(() => {});
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
        setTimeout(onClose, 4000);
      },
      async () => {
        // fallback to Addis Ababa default
        await api.updateLocation(9.032, 38.7469).catch(() => {});
        setDenied(true);
        setLoading(false);
        setTimeout(onClose, 1800);
      }
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,26,22,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} className="animate-fadeIn">
      <div style={{ background: 'white', borderRadius: 20, padding: '2.5rem', maxWidth: 420, width: '100%', textAlign: 'center', position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,.2)' }} className="animate-fadeUp">
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
          <X size={20} />
        </button>

        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#0d9488,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }} className="animate-pulse-ring">
          <MapPin size={32} color="white" />
        </div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, marginBottom: '.75rem', color: '#0a1a16' }}>
          Allow Location Access
        </h2>
        <p style={{ color: '#6b8f84', lineHeight: 1.6, marginBottom: '1.75rem', fontSize: '.95rem' }}>
          Pharmasify uses your location to show medicines from pharmacies near you. Your location is never shared with third parties.
        </p>

        {denied && (
          <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10, padding: '.75rem', marginBottom: '1rem', color: '#854d0e', fontSize: '.875rem' }}>
            Location denied — using Addis Ababa as default 📍
          </div>
        )}

        {coords && (
          <div style={{ marginBottom: '1rem', borderRadius: 12, overflow: 'hidden', border: '1px solid #d1ebe6' }} className="animate-fadeIn">
            <iframe
              width="100%"
              height="180"
              frameBorder="0"
              style={{ border: 0, display: 'block' }}
              src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=14&output=embed`}
              allowFullScreen
            />
            <div style={{ background: '#dcfce7', color: '#166534', padding: '.5rem', fontSize: '.8rem', fontWeight: 600 }}>
              Location detected successfully!
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          <button onClick={requestLocation} disabled={loading} className="btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <Navigation size={18} />}
            {loading ? 'Getting Location...' : 'Allow Location Access'}
          </button>
          <button onClick={onClose} className="btn-secondary" style={{ justifyContent: 'center', width: '100%' }}>
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
}