'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { authService } from '@/services/auth';
import { useRouter } from 'next/navigation';
import {
  Plus, Package, ShoppingBag, AlertCircle, X,
  ShieldCheck, ShieldAlert, Store, Pencil, Trash2, CheckCircle2
} from 'lucide-react';
import type { Order } from '@/types';

interface MedicineItem {
  id: number;
  name: string;
  price: string;
  category: string;
  description: string;
  stock: number;
  image: string | null;
}

interface DashData {
  pharmacy: string;
  location: string;
  verified: boolean;
  total_medicines: number;
  latest_medicines: MedicineItem[];
  categories: { category: string; total: number }[];
}

const emptyForm = { name: '', description: '', price: '', category: '', stock: '', image: null as File | null };

export default function OwnerDashboard() {
  const router = useRouter();
  const [dash, setDash] = useState<DashData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [form, setForm] = useState(emptyForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadDash = useCallback(async () => {
    try {
      const [d, o] = await Promise.all([api.ownerDashboard(), api.pharmacyOrders()]);
      setDash(d);
      setOrders(o);
    } catch {
      // No pharmacy yet — redirect to onboarding
      router.push('/onboarding/owner');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authService.isLoggedIn()) { router.push('/auth'); return; }
    loadDash();
  }, [router, loadDash]);

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setMsg({ text: '', type: '' });
    setShowForm(true);
  }

  function openEdit(med: MedicineItem) {
    setEditId(med.id);
    setForm({ name: med.name, description: med.description, price: med.price, category: med.category, stock: String(med.stock), image: null });
    setMsg({ text: '', type: '' });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ text: '', type: '' });
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('price', form.price);
    fd.append('category', form.category);
    fd.append('stock', form.stock);
    if (form.image) fd.append('image', form.image);

    try {
      if (editId !== null) {
        await api.updateMedicine(editId, fd);
        setMsg({ text: 'Medicine updated!', type: 'success' });
      } else {
        await api.createMedicine(fd);
        setMsg({ text: 'Medicine added!', type: 'success' });
      }
      await loadDash();
      setTimeout(() => setShowForm(false), 1200);
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : 'Error saving medicine', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this medicine? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.deleteMedicine(id);
      await loadDash();
    } catch {
      alert('Failed to delete medicine.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
      <span className="spinner" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'var(--brand)', width: 40, height: 40, borderWidth: 3 }} />
    </div>
  );

  /* ─── PENDING VERIFICATION SCREEN ─── */
  if (!dash?.verified) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-light)', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--brand), #10b981)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Store size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>{dash?.pharmacy || 'Your Pharmacy'}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{dash?.location}</p>
          </div>
        </div>
        {/* Pending card */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="animate-fadeUp" style={{ background: 'var(--surface)', borderRadius: '28px', padding: '3.5rem 3rem', maxWidth: 560, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'inline-flex', background: '#fef3c7', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.75rem' }}>
              <ShieldAlert size={56} color="#d97706" />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>Pending Admin Verification</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '0.75rem' }}>
              Your pharmacy application has been submitted. The admin is reviewing your <strong>license document</strong>.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Once approved, you will automatically gain access to the full dashboard where you can add medicines and manage orders.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => window.location.reload()} className="btn-primary" style={{ padding: '0.8rem 1.75rem' }}>
                <CheckCircle2 size={18} /> Check Status
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── VERIFIED OWNER DASHBOARD ─── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingBottom: '4rem' }}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-light)', padding: '2rem 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg, var(--brand), #10b981)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(15,157,88,0.2)' }}>
              <Store size={28} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>{dash.pharmacy}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>📍 {dash.location}</span>
                <span className="badge badge-confirmed" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}>
                  <ShieldCheck size={13} /> Verified
                </span>
              </div>
            </div>
          </div>
          <button onClick={openAdd} className="btn-primary" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Add Medicine
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '2.5rem auto 0', padding: '0 1.5rem' }} className="animate-fadeIn">

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Total Medicines', value: dash.total_medicines, emoji: '💊', color: 'var(--brand)' },
            { label: 'Categories', value: dash.categories?.length || 0, emoji: '📂', color: '#0284c7' },
            { label: 'Orders Received', value: orders.length, emoji: '📦', color: '#8b5cf6' },
          ].map((s, i) => (
            <div key={i} className="card-hover" style={{ borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>{s.emoji}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 500 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>

          {/* Medicine List with Edit/Delete */}
          <div className="card-hover" style={{ borderRadius: '20px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={20} color="var(--brand)" /> My Medicines
              </h3>
              <span className="badge badge-confirmed">{dash.total_medicines}</span>
            </div>
            {dash.latest_medicines.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', background: 'var(--bg-color)', borderRadius: '12px', border: '1px dashed var(--border-light)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💊</div>
                <p>No medicines yet. Click <strong>Add Medicine</strong> to get started.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {dash.latest_medicines.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1rem', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {m.category} · Stock: {m.stock}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, color: 'var(--brand)', fontSize: '0.9rem' }}>ETB {m.price}</span>
                      <button
                        onClick={() => openEdit(m)}
                        style={{ background: '#e0f2fe', border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', color: '#0284c7', display: 'flex' }}
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deletingId === m.id}
                        style={{ background: '#fee2e2', border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', color: '#dc2626', display: 'flex' }}
                        title="Delete"
                      >
                        {deletingId === m.id ? <span className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="card-hover" style={{ borderRadius: '20px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={20} color="#8b5cf6" /> Recent Orders
            </h3>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', background: 'var(--bg-color)', borderRadius: '12px', border: '1px dashed var(--border-light)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                <p>No orders received yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {orders.slice(0, 8).map(o => (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1rem', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>Order #{o.id}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{new Date(o.created_at).toLocaleDateString()}</div>
                    </div>
                    <span className={`badge badge-${o.status}`}>{o.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Medicine Modal */}
      {showForm && (
        <div
          onClick={() => setShowForm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
          className="animate-fadeIn"
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--surface)', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 32px 64px rgba(0,0,0,0.25)' }}
            className="animate-fadeUp"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {editId !== null ? '✏️ Edit Medicine' : '💊 Add New Medicine'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
                  {editId !== null ? 'Update medicine details below.' : 'Fill in the details to publish a new medicine.'}
                </p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'var(--bg-color)', border: 'none', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {msg.text && (
              <div style={{ padding: '0.9rem 1rem', borderRadius: '12px', marginBottom: '1.5rem', background: msg.type === 'error' ? '#fee2e2' : '#dcfce7', color: msg.type === 'error' ? '#dc2626' : '#16a34a', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                {msg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                {msg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Medicine Name *</label>
                <input
                  type="text" className="input-premium" required
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Paracetamol 500mg"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Description *</label>
                <textarea
                  className="input-premium" rows={3} required
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="What is this medicine used for?"
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Price (ETB) *</label>
                  <input
                    type="number" step="0.01" min="0" className="input-premium" required
                    value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Stock Qty *</label>
                  <input
                    type="number" min="0" className="input-premium" required
                    value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                    placeholder="e.g. 100"
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Category *</label>
                <input
                  type="text" className="input-premium" required
                  value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Painkiller, Antibiotic"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Product Image {editId !== null && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(leave empty to keep current)</span>}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', border: '2px dashed var(--border-light)', borderRadius: '12px', padding: '0.9rem 1.25rem', cursor: 'pointer', transition: 'border-color 0.2s', background: 'var(--bg-color)' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}>
                  <span style={{ fontSize: '1.5rem' }}>🖼️</span>
                  <span style={{ fontSize: '0.9rem', color: form.image ? 'var(--brand)' : 'var(--text-muted)' }}>
                    {form.image ? form.image.name : 'Click to choose image (JPG, PNG)'}
                  </span>
                  <input type="file" accept="image/*" onChange={e => setForm({ ...form, image: e.target.files?.[0] || null })} style={{ display: 'none' }} />
                </label>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '1rem', fontSize: '1rem', marginTop: '0.5rem' }}>
                {submitting ? <span className="spinner" /> : (editId !== null ? 'Save Changes' : 'Publish Medicine')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}