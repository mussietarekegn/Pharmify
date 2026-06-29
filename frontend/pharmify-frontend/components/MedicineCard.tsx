'use client';
import Link from 'next/link';
import { ShoppingCart, MapPin, Heart, Star } from 'lucide-react';
import type { Medicine } from '@/types';
import { api } from '@/lib/api';
import { authService } from '@/services/auth';
import { useState } from 'react';

interface Props {
  medicine: Medicine;
  delay?: number;
  onClick?: (m: Medicine) => void;
}

export default function MedicineCard({ medicine, delay = 0, onClick }: Props) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!authService.isLoggedIn()) { window.location.href = '/auth'; return; }
    setAdding(true);
    await api.addToCart(medicine.id, 1).catch(() => {});
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const stockColor = medicine.stock === 0 ? '#ef4444' : medicine.stock < 10 ? '#f59e0b' : '#22c55e';

  const CardContent = (
    <div
      className="card-hover animate-fadeUp"
      onClick={() => onClick && onClick(medicine)}
      style={{
        background: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #e8f5f2',
        animationDelay: `${delay}ms`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
        {/* Image */}
        <div style={{ height: 180, background: 'linear-gradient(135deg,#f0fdfa,#dcfce7)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {medicine.image_url ? (
            <img src={medicine.image_url} alt={medicine.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ fontSize: '3.5rem' }}>💊</div>
          )}
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'white', borderRadius: 999, padding: '.2rem .6rem', fontSize: '.72rem', fontWeight: 600, color: '#0f766e', border: '1px solid #d1ebe6' }}>
            {medicine.category}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.5rem', flex: 1 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#0a1a16', lineHeight: 1.3 }}>
            {medicine.name}
          </h3>
          <p style={{ color: '#6b8f84', fontSize: '.82rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {medicine.description}
          </p>

          {/* Rating & Match */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 1 }}>
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={12} fill={i <= Math.round(medicine.average_rating) ? '#f59e0b' : 'none'} color={i <= Math.round(medicine.average_rating) ? '#f59e0b' : '#d1d5db'} />
              ))}
            </div>
            <span style={{ fontSize: '.75rem', color: '#9ca3af' }}>({medicine.reviews_count})</span>
            
            {medicine.match_percentage && (
              <>
                <span style={{ color: '#d1d5db', fontSize: '.75rem' }}>|</span>
                <span style={{ fontSize: '.7rem', fontWeight: 600, color: '#0d9488', background: '#f0fdfa', padding: '.1rem .4rem', borderRadius: 4 }}>
                  {medicine.match_percentage}% Match
                </span>
              </>
            )}
          </div>

          {/* Location / Distance */}
          {medicine.distance_km !== undefined && medicine.distance_km !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', color: '#6b8f84', fontSize: '.75rem', fontWeight: 500 }}>
              <MapPin size={12} />
              {medicine.distance_km} km away
            </div>
          )}

          {/* Stock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: stockColor }} />
            <span style={{ fontSize: '.75rem', color: stockColor, fontWeight: 500 }}>
              {medicine.stock === 0 ? 'Out of Stock' : medicine.stock < 10 ? `Only ${medicine.stock} left` : 'In Stock'}
            </span>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '.5rem', borderTop: '1px solid #f0f9f6' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: '#0d9488' }}>
              ETB {Number(medicine.price).toLocaleString()}
            </span>
            <button
              onClick={handleAddToCart}
              disabled={adding || medicine.stock === 0}
              style={{
                background: added ? '#dcfce7' : medicine.stock === 0 ? '#f3f4f6' : 'linear-gradient(135deg,#0d9488,#16a34a)',
                color: added ? '#166534' : medicine.stock === 0 ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: 8,
                padding: '.45rem .9rem',
                cursor: medicine.stock === 0 ? 'not-allowed' : 'pointer',
                fontSize: '.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '.3rem',
                transition: 'all .2s',
              }}
            >
              <ShoppingCart size={14} />
              {adding ? '...' : added ? 'Added!' : 'Add'}
            </button>
          </div>
        </div>
      </div>
  );

  return onClick ? CardContent : (
    <Link href={`/medicines/${medicine.id}`} style={{ textDecoration: 'none' }}>
      {CardContent}
    </Link>
  );
}