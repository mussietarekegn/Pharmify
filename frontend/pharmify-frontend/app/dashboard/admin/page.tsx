'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { authService } from '@/services/auth';
import { useRouter } from 'next/navigation';

import {
  Users, Building2, Package, ShoppingBag, DollarSign,
  CheckCircle, Clock, XCircle, Eye, Shield, AlertTriangle, 
  RefreshCw, X, FileText, Activity, Truck, Trash2, UserCog
} from 'lucide-react';
import type { Order, Pharmacy, User } from '@/types';

interface DashStats {
  total_users: number;
  total_customers: number;
  total_owners: number;
  total_pharmacies: number;
  verified_pharmacies: number;
  total_medicines: number;
  total_orders: number;
  total_sales: number;
}


interface ActivityData {
  latest_users: { id: number; username: string; role: string }[];
  latest_orders: { id: number; user: string; total_price: number; status: string }[];
  latest_medicines: { id: number; name: string; price: number }[];
}

type Tab = 'overview' | 'pharmacies' | 'orders' | 'users';

const STATUS_COLORS: Record<string, string> = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  delivered: 'badge-delivered',
  cancelled: 'badge-cancelled',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={13} />,
  confirmed: <CheckCircle size={13} />,
  delivered: <Truck size={13} />,
  cancelled: <XCircle size={13} />,
};

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<DashStats | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingUser, setDeletingUser] = useState<number | null>(null);
  const [deletingPharmacy, setDeletingPharmacy] = useState<number | null>(null);

  // Modals
  const [licenseModal, setLicenseModal] = useState<{ url: string; name: string } | null>(null);
  const [verifying, setVerifying] = useState<number | null>(null);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [pharmacyFilter, setPharmacyFilter] = useState<'all' | 'verified' | 'pending'>('all');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const statsData = await api.adminDashboard().catch(e => { console.error("Stats 404", e); return null; });
      if (statsData) setStats(statsData as DashStats);

      const activityData = await api.recentActivity().catch(e => { console.error("Activity 404", e); return null; });
      if (activityData) setActivity(activityData as ActivityData);

      const phData = await api.getPharmacies().catch(e => { console.error("Pharmacies 404", e); return []; });
      setPharmacies(phData as Pharmacy[]);

      const ordersData = await api.allOrders().catch(e => { console.error("Orders 404", e); return []; });
      setOrders(ordersData);

      const usersData = await api.listUsers().catch(e => {
        console.error("Users 404", e);
        // Fallback or show alert if crucial
        return [];
      });
      setUsers(usersData);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const user = authService.getUser();
    if (!user || user.role !== 'admin') {
      router.push('/auth');
      return;
    }
    loadAll();
  }, [loadAll]);

  async function refresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  async function handleVerify(id: number) {
    try {
      setVerifying(id);
      await api.verifyPharmacy(id);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Error verifying pharmacy');
    } finally {
      setVerifying(null);
    }
  }

  async function handleReject(id: number) {
    if (!confirm('Are you sure you want to reject and delete this pharmacy application?')) return;
    try {
      setVerifying(id);
      await api.rejectPharmacy(id);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Error rejecting pharmacy');
    } finally {
      setVerifying(null);
    }
  }

  async function handleDeleteUser(userId: number) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setDeletingUser(userId);
    try {
      await api.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (e) {
      alert('Error deleting user');
    }
    setDeletingUser(null);
  }

  async function handleDeletePharmacy(pharmacyId: number, pharmacyName: string) {
    if (!confirm(`Are you sure you want to permanently delete "${pharmacyName}"? This will also remove all their medicines. This cannot be undone.`)) return;
    setDeletingPharmacy(pharmacyId);
    try {
      await api.deletePharmacy(pharmacyId);
      setPharmacies(pharmacies.filter(p => p.id !== pharmacyId));
    } catch (e: any) {
      alert(e.message || 'Error deleting pharmacy');
    }
    setDeletingPharmacy(null);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', background: 'var(--bg-color)' }}>
      <span className="spinner" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'var(--brand)', width: 40, height: 40, borderWidth: 3 }} />
      <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Loading control panel...</p>
    </div>
  );

  const pendingPharmacies = pharmacies.filter(p => !p.is_verified);
  const verifiedPharmacies = pharmacies.filter(p => p.is_verified);

  const filteredPharmacies = pharmacyFilter === 'all' ? pharmacies
    : pharmacyFilter === 'verified' ? verifiedPharmacies
    : pendingPharmacies;

  const filteredOrders = orderFilter === 'all' ? orders
    : orders.filter(o => o.status === orderFilter);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingBottom: '4rem' }}>

      {/* License Modal */}
      {licenseModal && (
        <div
          onClick={() => setLicenseModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
          className="animate-fadeIn"
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--surface)', borderRadius: '24px', overflow: 'hidden', maxWidth: 800, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            className="animate-fadeUp"
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-main)', fontSize: '1.25rem' }}>License Document</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{licenseModal.name}</p>
              </div>
              <button onClick={() => setLicenseModal(null)} style={{ background: 'var(--bg-color)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}>
                <X size={18} color="var(--text-muted)" />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
              {licenseModal.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={licenseModal.url}
                  alt="License"
                  style={{ maxWidth: '100%', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.img-error-msg')) {
                      const msg = document.createElement('div');
                      msg.className = 'img-error-msg';
                      msg.style.cssText = 'text-align:center;padding:2rem;';
                      msg.innerHTML = `<p style="color:#ef4444;font-weight:600;margin-bottom:1rem;">⚠️ Image could not be loaded</p><p style="color:#6b7280;font-size:0.85rem;margin-bottom:1rem;">The file may have been removed from the server.</p><a href="${licenseModal.url}" target="_blank" style="color:#0d9488;font-weight:600;">Try Direct URL →</a>`;
                      parent.appendChild(msg);
                    }
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
                  <FileText size={48} color="var(--brand)" style={{ marginBottom: '1.5rem' }} />
                  <p style={{ color: 'var(--text-main)', marginBottom: '0.75rem', fontWeight: 600 }}>License Document</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Click below to open the document. If it shows "Not Found", the file was not retained on the server after deployment.</p>
                  <a
                    href={licenseModal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ textDecoration: 'none', display: 'inline-flex', padding: '0.8rem 1.5rem' }}
                  >
                    Open Document in New Tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header Panel */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-light)', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--brand), #10b981)', borderRadius: '12px', padding: '10px', boxShadow: '0 4px 12px rgba(15,157,88,0.2)' }}>
              <Shield size={24} color="white" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-main)' }}>
              Pharmify Admin
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Control panel & management terminal
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {pendingPharmacies.length > 0 && (
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '999px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} color="#d97706" />
              <span style={{ color: '#d97706', fontSize: '0.85rem', fontWeight: 700 }}>
                {pendingPharmacies.length} Pending Approvals
              </span>
            </div>
          )}
          <button
            onClick={refresh}
            disabled={refreshing}
            className="btn-secondary"
            style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
          >
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-light)', padding: '0 2rem', display: 'flex', gap: '1rem', overflowX: 'auto' }}>
        {([
          { key: 'overview', label: 'Overview', icon: <Activity size={18} /> },
          { key: 'pharmacies', label: `Pharmacies${pendingPharmacies.length > 0 ? ` (${pendingPharmacies.length})` : ''}`, icon: <Building2 size={18} /> },
          { key: 'orders', label: 'Orders', icon: <ShoppingBag size={18} /> },
          { key: 'users', label: 'Users', icon: <Users size={18} /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '1.25rem 0.5rem', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem',
              color: tab === t.key ? 'var(--brand)' : 'var(--text-muted)',
              borderBottom: tab === t.key ? '3px solid var(--brand)' : '3px solid transparent',
              display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2.5rem' }}>

        {/* Overview content */}
        {tab === 'overview' && (
          <div className="animate-fadeUp">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              {[
                { label: 'Total Users', value: stats?.total_users || 0, sub: `${stats?.total_customers || 0} C · ${stats?.total_owners || 0} O`, icon: <Users size={24} />, color: '#8b5cf6', bg: '#f3e8ff' },
                { label: 'Pharmacies', value: stats?.total_pharmacies || 0, sub: `${stats?.verified_pharmacies || 0} verified`, icon: <Building2 size={24} />, color: 'var(--brand)', bg: 'rgba(15,157,88,0.1)' },
                { label: 'Medicines', value: stats?.total_medicines || 0, sub: 'Listed products', icon: <Package size={24} />, color: '#10b981', bg: '#d1fae5' },
                { label: 'Total Orders', value: stats?.total_orders || 0, sub: 'All items', icon: <ShoppingBag size={24} />, color: '#f59e0b', bg: '#fef3c7' },
                { label: 'Total Revenue', value: `ETB ${(stats?.total_sales || 0).toLocaleString()}`, sub: 'Completed transactions', icon: <DollarSign size={24} />, color: '#0ea5e9', bg: '#e0f2fe' },
              ].map((s, i) => (
                <div key={i} className="card-hover" style={{ background: 'var(--surface)', borderRadius: '20px', padding: '1.5rem', border: '1px solid var(--border-light)' }}>
                  <div style={{ width: 50, height: 50, borderRadius: '14px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    {s.icon}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-main)', lineHeight: 1.2 }}>{s.value}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {/* Activity Cards */}
              <div className="card-hover" style={{ background: 'var(--surface)', borderRadius: '20px', padding: '1.5rem', border: '1px solid var(--border-light)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={20} color="var(--brand)" /> Active Accessions
                </h3>
                {activity?.latest_users.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No recent users.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {activity?.latest_users.map(u => (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>{u.username}</span>
                        <span style={{ background: 'rgba(15,157,88,0.1)', color: 'var(--brand)', borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>{u.role.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card-hover" style={{ background: 'var(--surface)', borderRadius: '20px', padding: '1.5rem', border: '1px solid var(--border-light)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingBag size={20} color="var(--brand)" /> Outbound Orders
                </h3>
                {activity?.latest_orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No recent orders.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {activity?.latest_orders.map(o => (
                      <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>Order #{o.id}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>ETB {Number(o.total_price).toLocaleString()}</div>
                        </div>
                        <span className={`badge ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pharmacy logic panel */}
        {tab === 'pharmacies' && (
          <div className="animate-fadeUp">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Pharmacies Terminal</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>Manage and verify pharmacy applications</p>
              </div>
              <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '4px' }}>
                {([
                  { key: 'all', label: 'All' },
                  { key: 'pending', label: 'Pending' },
                  { key: 'verified', label: 'Verified' },
                ] as { key: typeof pharmacyFilter; label: string }[]).map(f => (
                  <button
                    key={f.key}
                    onClick={() => setPharmacyFilter(f.key)}
                    style={{
                      padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      background: pharmacyFilter === f.key ? 'var(--bg-color)' : 'transparent',
                      color: pharmacyFilter === f.key ? 'var(--brand)' : 'var(--text-muted)',
                      fontWeight: 600, transition: 'all 0.2s',
                      boxShadow: pharmacyFilter === f.key ? 'var(--shadow-sm)' : 'none'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredPharmacies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--surface)', borderRadius: '24px', border: '1px dashed var(--border-light)' }}>
                <Building2 size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>No pharmacies found</h3>
                <p style={{ color: 'var(--text-muted)' }}>There are no pharmacies matching this filter.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {filteredPharmacies.map(ph => (
                  <div key={ph.id} className="card-hover" style={{ background: 'var(--surface)', borderRadius: '20px', padding: '1.5rem', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{ph.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          📍 {ph.location}
                        </p>
                      </div>
                      <span className={`badge ${ph.is_verified ? 'badge-confirmed' : 'badge-pending'}`}>
                        {ph.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {ph.license_document_url ? (
                        <button
                          onClick={() => setLicenseModal({ url: ph.license_document_url!, name: ph.name })}
                          className="btn-secondary"
                          style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                        >
                          <Eye size={16} /> View License
                        </button>
                      ) : (
                        <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, padding: '0.6rem 1rem', background: '#fee2e2', borderRadius: '10px' }}>No Document</span>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {!ph.is_verified && (
                          <>
                            <button
                              onClick={() => handleVerify(ph.id)}
                              disabled={verifying === ph.id}
                              className="btn-primary"
                              style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
                            >
                              {verifying === ph.id ? <span className="spinner" /> : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(ph.id)}
                              disabled={verifying === ph.id}
                              className="btn-secondary"
                              style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', color: '#dc2626', borderColor: '#fee2e2', background: '#fef2f2' }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeletePharmacy(ph.id, ph.name)}
                          disabled={deletingPharmacy === ph.id}
                          title="Delete Pharmacy"
                          style={{
                            background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px',
                            padding: '0.6rem 0.9rem', cursor: 'pointer', color: '#dc2626',
                            display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem',
                            fontWeight: 600, transition: 'all 0.2s'
                          }}
                        >
                          {deletingPharmacy === ph.id ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <><Trash2 size={15} /> Delete</>}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders section */}
        {tab === 'orders' && (
          <div className="animate-fadeUp">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>All Orders</h2>
            
            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--surface)', borderRadius: '24px', border: '1px dashed var(--border-light)' }}>
                <ShoppingBag size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>No orders found</h3>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredOrders.map(order => (
                  <div key={order.id} className="card-hover" style={{ background: 'var(--surface)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>Order #{order.id}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(order.created_at).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {order.items?.map(item => (
                          <span key={item.id} style={{ background: 'var(--bg-color)', border: '1px solid var(--border-light)', padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
                            {item.medicine?.name} <span style={{ color: 'var(--brand)' }}>x{item.quantity}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>ETB {Number(order.total_price).toLocaleString()}</span>
                      <span className={`badge ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Management */}
        {tab === 'users' && (
          <div className="animate-fadeUp">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>User Management</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>View and manage all registered accounts</p>
              </div>
              <div style={{ display: 'flex', background: 'var(--surface)', padding: '0.6rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-light)', gap: '1rem', fontWeight: 600 }}>
                Total: <span style={{ color: 'var(--brand)' }}>{users.length} Users</span>
              </div>
            </div>

            {users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--surface)', borderRadius: '24px', border: '1px dashed var(--border-light)' }}>
                <Users size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>No users found</h3>
              </div>
            ) : (
              <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-color)', borderBottom: '1px solid var(--border-light)' }}>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>ID</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Username</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Email</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Role</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }} className="table-row-hover">
                          <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>#{u.id}</td>
                          <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>{u.username}</td>
                          <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{u.email}</td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <span style={{
                              background: u.role === 'admin' ? '#fef3c7' : u.role === 'owner' ? '#e0f2fe' : '#d1fae5',
                              color: u.role === 'admin' ? '#d97706' : u.role === 'owner' ? '#0ea5e9' : '#10b981',
                              padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
                            }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={deletingUser === u.id}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  color: deletingUser === u.id ? '#9ca3af' : '#ef4444',
                                  padding: '0.4rem', borderRadius: '8px', transition: 'background 0.2s'
                                }}
                                title="Delete User"
                                className="hover-bg-red"
                              >
                                {deletingUser === u.id ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Trash2 size={18} />}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}