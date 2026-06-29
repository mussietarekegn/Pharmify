'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Medicine, Review } from '@/types';
import { MapPin, ShoppingCart, ArrowLeft, Package, Store, Star } from 'lucide-react';
import StarRating from '@/components/StarRating';
import { authService } from '@/services/auth';

export default function MedicineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  useEffect(() => {
    Promise.all([
      api.getMedicine(Number(id)),
      api.getReviews(Number(id)),
    ]).then(([med, revs]) => {
      setMedicine(med);
      setReviews(revs);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  async function addToCart() {
    if (!authService.isLoggedIn()) { router.push('/auth'); return; }
    setAdding(true);
    await api.addToCart(Number(id), 1).catch(() => {});
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!authService.isLoggedIn()) { router.push('/auth'); return; }
    setSubmittingReview(true);
    try {
      await api.addReview(Number(id), rating, comment);
      setComment('');
      const revs = await api.getReviews(Number(id));
      setReviews(revs);
      setReviewMsg('Review submitted!');
    } catch { setReviewMsg('Error submitting review.'); }
    finally { setSubmittingReview(false); setTimeout(() => setReviewMsg(''), 3000); }
  }

  function openMap(location: string) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
  }

  if (loading) return (
    <div style={{ maxWidth: 900, margin: '3rem auto', padding: '0 1.5rem' }}>
      <div className="skeleton" style={{ height: 400, borderRadius: 20, marginBottom: '2rem' }} />
      <div className="skeleton" style={{ height: 40, width: '60%', marginBottom: '1rem' }} />
      <div className="skeleton" style={{ height: 100 }} />
    </div>
  );

  if (!medicine) return <div style={{ textAlign: 'center', padding: '4rem' }}>Medicine not found.</div>;

  const stockColor = medicine.stock === 0 ? '#ef4444' : medicine.stock < 10 ? '#f59e0b' : '#22c55e';

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: 'none', border: 'none', cursor: 'pointer', color: '#6b8f84', fontWeight: 500, marginBottom: '1.5rem', fontSize: '.9rem' }}>
        <ArrowLeft size={18} /> Back
      </button>

      <div className="animate-fadeUp" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', background: 'white', borderRadius: 24, padding: '2rem', boxShadow: '0 8px 32px rgba(13,148,136,.08)', border: '1px solid #e8f5f2', marginBottom: '2rem' }}>
        
        {/* Image */}
        <div style={{ borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg,#f0fdfa,#dcfce7)', height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {medicine.image_url ? (
            <img src={medicine.image_url} alt={medicine.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ fontSize: '6rem' }}>💊</div>
          )}
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <span style={{ background: '#f0fdfa', color: '#0d9488', borderRadius: 999, padding: '.2rem .75rem', fontSize: '.8rem', fontWeight: 600, border: '1px solid #d1ebe6' }}>
              {medicine.category}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: '#0a1a16', lineHeight: 1.2 }}>
            {medicine.name}
          </h1>
          <p style={{ color: '#6b8f84', lineHeight: 1.7, fontSize: '.95rem' }}>
            {medicine.description}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <StarRating rating={medicine.average_rating} size={20} />
            <span style={{ color: '#6b8f84', fontSize: '.875rem' }}>{medicine.average_rating} ({medicine.reviews_count} reviews)</span>
          </div>

          <div style={{ display: 'flex', gap: '.5rem', padding: '.75rem', background: '#f0fdfa', borderRadius: 10 }}>
            <Package size={18} color={stockColor} />
            <span style={{ fontWeight: 600, color: stockColor, fontSize: '.9rem' }}>
              {medicine.stock === 0 ? 'Out of Stock' : medicine.stock < 10 ? `Low Stock — only ${medicine.stock} left` : `In Stock (${medicine.stock} units)`}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', padding: '.75rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <Store size={18} color="#0d9488" />
              <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '.9rem' }}>{medicine.pharmacy_name || 'Pharmacy'}</span>
            </div>
            {medicine.owner_phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: '#475569', fontSize: '.85rem' }}>
                <span>📞 {medicine.owner_phone}</span>
              </div>
            )}
            {medicine.pharmacy_location && (
              <button onClick={() => openMap(medicine.pharmacy_location!)} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#0d9488', fontSize: '.85rem', padding: 0, textAlign: 'left', fontWeight: 500 }}>
                <MapPin size={16} /> {medicine.pharmacy_location} (Click to open Maps)
              </button>
            )}
          </div>

          <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: '#0d9488' }}>
            ETB {Number(medicine.price).toLocaleString()}
          </div>

          <button onClick={addToCart} disabled={adding || medicine.stock === 0} className="btn-primary" style={{ justifyContent: 'center', padding: '.9rem', opacity: medicine.stock === 0 ? .5 : 1 }}>
            <ShoppingCart size={20} />
            {adding ? 'Adding...' : added ? '✓ Added to Cart!' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {/* Reviews */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Existing reviews */}
        <div style={{ background: 'white', borderRadius: 20, padding: '1.5rem', border: '1px solid #e8f5f2' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem', color: '#0a1a16' }}>
            Reviews ({reviews.length})
          </h3>
          {reviews.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '.9rem' }}>No reviews yet. Be the first!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', maxHeight: 320, overflowY: 'auto' }}>
              {reviews.map(r => (
                <div key={r.id} style={{ borderBottom: '1px solid #f0f9f6', paddingBottom: '.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.3rem' }}>
                    <StarRating rating={r.rating} size={14} />
                    <span style={{ fontSize: '.75rem', color: '#9ca3af' }}>{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: '.875rem', color: '#374151', lineHeight: 1.5 }}>{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Write review */}
        <div style={{ background: 'white', borderRadius: 20, padding: '1.5rem', border: '1px solid #e8f5f2' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem', color: '#0a1a16' }}>
            Write a Review
          </h3>
          <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#6b8f84', display: 'block', marginBottom: '.4rem' }}>Your Rating</label>
              <StarRating rating={rating} size={28} interactive onChange={setRating} />
            </div>
            <div>
              <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#6b8f84', display: 'block', marginBottom: '.4rem' }}>Comment</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} placeholder="Share your experience..." required
                style={{ width: '100%', border: '1.5px solid #d1ebe6', borderRadius: 10, padding: '.75rem', fontSize: '.9rem', outline: 'none', fontFamily: 'var(--font-body)', resize: 'vertical' }} />
            </div>
            {reviewMsg && <div style={{ color: reviewMsg.includes('Error') ? '#ef4444' : '#22c55e', fontSize: '.875rem', fontWeight: 500 }}>{reviewMsg}</div>}
            <button type="submit" disabled={submittingReview} className="btn-primary" style={{ justifyContent: 'center' }}>
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}