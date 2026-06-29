'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Cart } from '@/types';
import { Trash2, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authService.isLoggedIn()) { router.push('/auth'); return; }
    load();
  }, []);

  async function load() {
    setLoading(true);
    const c = await api.getCart().catch(() => null);
    setCart(c);
    setLoading(false);
  }

  async function remove(itemId: number) {
    setRemovingId(itemId);
    await api.removeFromCart(itemId).catch(() => {});
    setRemovingId(null);
    load();
  }

  async function placeOrder() {
    setOrdering(true);
    try {
      await api.createOrder();
      setOrderSuccess(true);
      setTimeout(() => { setOrderSuccess(false); load(); }, 2500);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Order failed');
    } finally {
      setOrdering(false);
    }
  }

  if (loading) return (
    <div style={{ maxWidth: 700, margin: '3rem auto', padding: '0 1.5rem' }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 16, marginBottom: '1rem' }} />)}
    </div>
  );

  const items = cart?.items || [];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: '#0a1a16', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        <ShoppingBag color="#0d9488" /> Your Cart
      </h1>

      {orderSuccess && (
        <div className="animate-fadeUp" style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 14, padding: '1.25rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>✅</div>
          <h3 style={{ fontFamily: 'var(--font-display)', color: '#166534', fontWeight: 700 }}>Order Placed Successfully!</h3>
          <p style={{ color: '#15803d', fontSize: '.875rem' }}>Your order is being processed.</p>
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#0a1a16', marginBottom: '.5rem' }}>Your cart is empty</h3>
          <p style={{ color: '#6b8f84', marginBottom: '1.5rem' }}>Add medicines to get started.</p>
          <Link href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Browse Medicines</Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginBottom: '1.5rem' }}>
            {items.map(item => (
              <div key={item.id} className="animate-fadeUp" style={{ background: 'white', borderRadius: 16, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #e8f5f2', boxShadow: '0 2px 8px rgba(13,148,136,.05)' }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg,#f0fdfa,#dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                  {item.medicine.image_url ? <img src={item.medicine.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} /> : '💊'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#0a1a16', fontSize: '.95rem' }}>{item.medicine.name}</div>
                  <div style={{ color: '#6b8f84', fontSize: '.8rem' }}>Qty: {item.quantity}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#0d9488', fontSize: '1rem' }}>
                  ETB {(Number(item.medicine.price) * item.quantity).toLocaleString()}
                </div>
                <button onClick={() => remove(item.id)} disabled={removingId === item.id}
                  style={{ background: '#fee2e2', border: 'none', borderRadius: 8, padding: '.4rem', cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{ background: 'white', borderRadius: 20, padding: '1.5rem', border: '1px solid #e8f5f2', boxShadow: '0 4px 16px rgba(13,148,136,.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f0f9f6' }}>
              <span style={{ color: '#6b8f84', fontWeight: 500 }}>Total ({items.length} items)</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: '#0a1a16' }}>
                ETB {Number(cart?.total_price || 0).toLocaleString()}
              </span>
            </div>
            <button onClick={placeOrder} disabled={ordering} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '.9rem' }}>
              {ordering ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Package size={18} /> Place Order</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}