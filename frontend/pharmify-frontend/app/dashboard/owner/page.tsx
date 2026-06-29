'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { authService } from '@/services/auth';
import { useRouter } from 'next/navigation';
import { Plus, Package, ShoppingBag, BarChart3, AlertCircle, X, ShieldCheck, ShieldAlert, Store } from 'lucide-react';
import type { Order } from '@/types';

interface DashData {
  pharmacy: string;
  location: string;
  verified: boolean;
  total_medicines: number;
  latest_medicines: { id: number; name: string; price: string; category: string }[];
  categories: { category: string; total: number }[];
}

export default function OwnerDashboard() {
  const router = useRouter();
  const [dash, setDash] = useState<DashData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add Medicine Modal State
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState({ text: '', type: '' });
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', stock: '', image: null as File | null });

  useEffect(() => {
    if (!authService.isLoggedIn()) { router.push('/auth'); return; }
    
    Promise.all([
      api.ownerDashboard(),
      api.pharmacyOrders(),
    ]).then(([d, o]) => { 
      setDash(d); 
      setOrders(o); 
      setLoading(false);
    }).catch((err) => {
      // If the dashboard fails to load, it might be because the pharmacy isn't created yet
      router.push('/onboarding/owner');
    });
  }, [router]);

  async function addMedicine(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddMsg({ text: '', type: '' });
    
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('price', form.price);
    fd.append('category', form.category);
    fd.append('stock', form.stock);
    if (form.image) fd.append('image', form.image);
    
    try {
      await api.createMedicine(fd);
      setAddMsg({ text: 'Medicine added successfully!', type: 'success' });
      setForm({ name: '', description: '', price: '', category: '', stock: '', image: null });
      
      const d = await api.ownerDashboard();
      setDash(d);
      
      setTimeout(() => setShowAddForm(false), 1500);
    } catch (err: unknown) {
      setAddMsg({ text: err instanceof Error ? err.message : 'Error adding medicine', type: 'error' });
    } finally {
      setAdding(false);
      setTimeout(() => setAddMsg({ text: '', type: '' }), 4000);
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
      <span className="spinner" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'var(--brand)', width: 40, height: 40, borderWidth: 3 }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingBottom: '4rem' }}>
      
      {/* Header Section */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-light)', padding: '2.5rem 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, var(--brand), #10b981)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(15,157,88,0.2)' }}>
              <Store size={32} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                {dash?.pharmacy || 'Owner Dashboard'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{dash?.location}</span>
                <span className={`badge ${dash?.verified ? 'badge-confirmed' : 'badge-pending'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {dash?.verified ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                  {dash?.verified ? 'Verified Pharmacy' : 'Pending Verification'}
                </span>
              </div>
            </div>
          </div>
          
          {dash?.verified && (
            <button onClick={() => setShowAddForm(true)} className="btn-primary" style={{ padding: '0.8rem 1.5rem' }}>
              <Plus size={18} /> Add Medicine
            </button>
          )}
        </div>
      </div>

      {!dash?.verified ? (
        <div style={{ maxWidth: 800, margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }} className="animate-fadeIn">
          <div style={{ background: '#fef3c7', padding: '3rem', borderRadius: '24px', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <ShieldAlert size={64} color="#92400e" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#92400e' }}>Waiting for Admin Verification</h2>
            <p style={{ fontSize: '1.1rem', color: '#b45309', maxWidth: 500, lineHeight: 1.6 }}>
              Your pharmacy has been registered successfully. You must wait for an administrator to review your license document and verify your pharmacy before you can access the dashboard to add medicines or view orders.
            </p>
            <button onClick={() => window.location.reload()} className="btn-secondary" style={{ marginTop: '2rem', background: 'white', color: '#92400e', border: '1px solid #fcd34d' }}>
              Refresh Status
            </button>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 1100, margin: '2.5rem auto 0', padding: '0 1.5rem' }} className="animate-fadeIn">
        
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Total Medicines', value: dash?.total_medicines || 0, emoji: '💊', color: 'var(--brand)' },
            { label: 'Categories', value: dash?.categories?.length || 0, emoji: '📂', color: '#0284c7' },
            { label: 'Orders Received', value: orders.length, emoji: '📦', color: '#8b5cf6' },
          ].map((s, i) => (
            <div key={i} className="card-hover" style={{ borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{s.emoji}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.4rem', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {/* Latest Medicines */}
          <div className="card-hover" style={{ borderRadius: '20px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={20} color="var(--brand)" /> Latest Medicines
              </h3>
            </div>
            
            {dash?.latest_medicines.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', background: 'var(--bg-color)', borderRadius: '12px', border: '1px dashed var(--border-light)' }}>
                No medicines added yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {dash?.latest_medicines.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--surface-hover)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>{m.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{m.category}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--brand)' }}>ETB {m.price}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="card-hover" style={{ borderRadius: '20px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={20} color="#8b5cf6" /> Recent Orders
            </h3>
            
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', background: 'var(--bg-color)', borderRadius: '12px', border: '1px dashed var(--border-light)' }}>
                No orders received yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--surface-hover)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>Order #{o.id}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{new Date(o.created_at).toLocaleDateString()}</div>
                    </div>
                    <span className={`badge badge-${o.status}`}>{o.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      )}
      
      {dash?.verified && showAddForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} className="animate-fadeIn">
          <div style={{ background: 'var(--surface)', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }} className="animate-fadeUp">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Add New Medicine</h3>
              <button onClick={() => setShowAddForm(false)} style={{ background: 'var(--bg-color)', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {addMsg.text && (
              <div style={{ padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', background: addMsg.type === 'error' ? '#fee2e2' : '#dcfce7', color: addMsg.type === 'error' ? '#dc2626' : '#16a34a', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {addMsg.type === 'error' ? <AlertCircle size={18} /> : <ShieldCheck size={18} />}
                {addMsg.text}
              </div>
            )}

            <form onSubmit={addMedicine} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>Medicine Name</label>
                <input type="text" className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Paracetamol 500mg" />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>Description</label>
                <textarea className="input-field" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required placeholder="What is it used for?"></textarea>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>Price (ETB)</label>
                  <input type="number" step="0.01" className="input-field" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>Initial Stock</label>
                  <input type="number" className="input-field" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required placeholder="Quantity" />
                </div>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>Category</label>
                <input type="text" className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required placeholder="e.g. Painkiller" />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>Product Image</label>
                <input type="file" className="input-field" accept="image/*" onChange={e => setForm({ ...form, image: e.target.files?.[0] || null })} style={{ padding: '0.75rem' }} />
              </div>
              
              <button type="submit" disabled={adding} className="btn-primary" style={{ padding: '1rem', marginTop: '0.5rem' }}>
                {adding ? <span className="spinner" /> : 'Save Medicine'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}