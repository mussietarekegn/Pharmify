'use client';
import { Medicine } from '@/types';
import { MapPin, Phone, X, ShoppingCart, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { authService } from '@/services/auth';
import { useState } from 'react';
import StarRating from './StarRating';

interface Props {
  medicine: Medicine;
  onClose: () => void;
}

export default function MedicineModal({ medicine, onClose }: Props) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAddToCart() {
    if (!authService.isLoggedIn()) { window.location.href = '/auth'; return; }
    setAdding(true);
    await api.addToCart(medicine.id, 1).catch(() => {});
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const stockColor = medicine.stock === 0 ? '#ef4444' : medicine.stock < 10 ? '#f59e0b' : '#22c55e';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,26,22,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} className="animate-fadeIn">
      <div style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 600, overflow: 'hidden', position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,.2)' }} className="animate-fadeUp">
        
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, color: '#4b5563' }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 240, background: 'linear-gradient(135deg,#f0fdfa,#dcfce7)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {medicine.image_url ? (
              <img src={medicine.image_url} alt={medicine.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ fontSize: '5rem' }}>💊</div>
            )}
            <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'white', borderRadius: 999, padding: '.3rem .8rem', fontSize: '.8rem', fontWeight: 600, color: '#0f766e', border: '1px solid #d1ebe6' }}>
              {medicine.category}
            </div>
          </div>

          <div style={{ padding: '1.5rem 2rem 2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', color: '#0a1a16', lineHeight: 1.2, marginBottom: '.5rem' }}>
                  {medicine.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <StarRating rating={medicine.average_rating} size={16} />
                  <span style={{ color: '#6b8f84', fontSize: '.85rem' }}>({medicine.reviews_count} reviews)</span>
                  
                  {medicine.match_percentage && (
                    <>
                      <span style={{ color: '#d1d5db' }}>|</span>
                      <span style={{ background: '#dcfce7', color: '#166534', padding: '0.1rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                        {medicine.match_percentage}% Match
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: '#0d9488' }}>
                ETB {Number(medicine.price).toLocaleString()}
              </div>
            </div>

            <p style={{ color: '#4b5563', lineHeight: 1.6, fontSize: '.95rem', marginBottom: '1.5rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1.5rem' }}>
              {medicine.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.4rem', color: '#64748b', fontSize: '.85rem', fontWeight: 600 }}>
                  <MapPin size={16} /> Location
                </div>
                <div style={{ color: '#0f172a', fontWeight: 500, fontSize: '.95rem' }}>
                  {medicine.pharmacy_name || 'Pharmacy'}
                </div>
                <div style={{ color: '#475569', fontSize: '.85rem', marginTop: '.2rem' }}>
                  {medicine.pharmacy_location}
                </div>
                {medicine.distance_km !== undefined && medicine.distance_km !== null && (
                  <div style={{ color: '#0d9488', fontSize: '.85rem', fontWeight: 600, marginTop: '.4rem' }}>
                    {medicine.distance_km} km away
                  </div>
                )}
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.4rem', color: '#64748b', fontSize: '.85rem', fontWeight: 600 }}>
                  <Phone size={16} /> Contact Pharmacy
                </div>
                {medicine.owner_phone ? (
                  <div style={{ color: '#0f172a', fontWeight: 500, fontSize: '.95rem' }}>
                    {medicine.owner_phone}
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '.9rem' }}>
                    No phone provided
                  </div>
                )}
                
                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: stockColor }} />
                  <span style={{ fontSize: '.85rem', color: stockColor, fontWeight: 600 }}>
                    {medicine.stock === 0 ? 'Out of Stock' : medicine.stock < 10 ? `Only ${medicine.stock} left` : 'In Stock'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={adding || medicine.stock === 0}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '1rem', opacity: medicine.stock === 0 ? 0.5 : 1 }}
            >
              <ShoppingCart size={18} />
              {adding ? 'Adding...' : added ? 'Added to Cart!' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
