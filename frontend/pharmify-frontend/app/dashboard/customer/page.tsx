'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Order, Medicine } from '@/types';
import { ShoppingBag, Clock, CheckCircle, XCircle, Truck, Search, Package, MapPin, Zap, Bot, Send, Activity, AlertTriangle } from 'lucide-react';
import { authService } from '@/services/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MedicineCard from '@/components/MedicineCard';
import SearchBar from '@/components/SearchBar';
import LocationModal from '@/components/LocationModal';
import MedicineModal from '@/components/MedicineModal';
import { useRef } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  ai_powered?: boolean;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock size={16} />,
  confirmed: <CheckCircle size={16} />,
  delivered: <Truck size={16} />,
  cancelled: <XCircle size={16} />,
};

export default function CustomerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'search' | 'orders' | 'ai'>('search');
  
  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  // Search State
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [topMedicines, setTopMedicines] = useState<Medicine[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(true);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [searchParams, setSearchParams] = useState<Record<string, string>>({});
  
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

  // AI Guide state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: "Hello! I'm your Pharmify AI health assistant. Describe your symptoms and I'll suggest possible conditions and medicine categories. Remember: always consult a doctor for serious concerns.", ai_powered: true }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const user = authService.getUser();

  useEffect(() => {
    if (!authService.isLoggedIn()) { router.push('/auth'); return; }
    
    // Check if just logged in to show location modal
    const justLoggedIn = sessionStorage.getItem('just_logged_in');
    if (justLoggedIn && user?.role === 'customer') {
      sessionStorage.removeItem('just_logged_in');
      setTimeout(() => setShowLocationModal(true), 500);
    }
    
    // Initial data fetch
    api.myOrders().then(setOrders).finally(() => setLoadingOrders(false));
    api.topMedicines().then(setTopMedicines).catch(() => {});
  }, [router, user?.role]);

  const loadMedicines = useCallback(async (params: Record<string, string>, pg: number) => {
    setLoadingSearch(true);
    try {
      const res = await api.getMedicines({ ...params, page: String(pg) });
      if (pg === 1) setMedicines(res.results);
      else setMedicines(prev => [...prev, ...res.results]);
      setTotalMedicines(res.count);
      setHasNext(!!res.next);
    } catch {
      setMedicines([]);
    } finally {
      setLoadingSearch(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    loadMedicines(searchParams, 1);
  }, [searchParams, loadMedicines]);

  const handleSearch = useCallback((params: Record<string, string>) => {
    setSearchParams(params);
    setActiveTab('search');
  }, []);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    loadMedicines(searchParams, next);
  }

  async function sendAiMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const text = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setChatLoading(true);
    try {
      const res = await api.aiGuide(text);
      setChatMessages(prev => [...prev, { role: 'assistant', text: res.response, ai_powered: res.ai_powered }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, the AI service is unavailable. Please try again later.', ai_powered: false }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }

  const isSearching = Object.keys(searchParams).length > 0;
  const totalSpent = orders.reduce((s, o) => s + Number(o.total_price), 0);
  const delivered = orders.filter(o => o.status === 'delivered').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingBottom: '4rem' }}>
      {showLocationModal && <LocationModal onClose={() => setShowLocationModal(false)} />}
      {selectedMedicine && <MedicineModal medicine={selectedMedicine} onClose={() => setSelectedMedicine(null)} />}
      
      {/* Header Section */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-light)', paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Welcome back, <span className="gradient-text">{user?.username}</span> 👋</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '0.4rem' }}>Find what you need or check your recent orders.</p>
            </div>
            <Link href="/cart" className="btn-primary">
              <ShoppingBag size={18} /> My Cart
            </Link>
          </div>
          
          {/* Dashboard Tabs */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { key: 'search', label: 'Find Medicines', icon: <Search size={17} /> },
              { key: 'orders', label: 'My Orders', icon: <Package size={17} /> },
              { key: 'ai', label: 'AI Guide', icon: <Bot size={17} /> },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                style={{
                  padding: '0.7rem 1.35rem',
                  borderRadius: '12px',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.45rem',
                  background: activeTab === t.key ? 'var(--brand)' : 'var(--bg-color)',
                  color: activeTab === t.key ? 'white' : 'var(--text-muted)',
                  border: activeTab === t.key ? 'none' : '1px solid var(--border-light)',
                  transition: 'all 0.2s ease'
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '2rem auto 0', padding: '0 1.5rem' }}>
        
        {/* TAB: SEARCH */}
        {activeTab === 'search' && (
          <div className="animate-fadeIn">
            {/* Search Bar Container */}
            <div style={{ marginBottom: '3rem', background: 'var(--surface)', padding: '1.5rem', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--brand)' }}>
                <Zap size={18} /> <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Typo-Tolerant Search Active</span>
              </div>
              <SearchBar onSearch={handleSearch} />
            </div>

            {/* Trending - Only show when not explicitly searching */}
            {!isSearching && topMedicines.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🔥 Trending Near You
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                  {topMedicines.slice(0, 4).map((m, i) => (
                    <MedicineCard key={m.id} medicine={m} delay={i * 80} onClick={setSelectedMedicine} />
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                {isSearching ? 'Search Results' : 'All Available Medicines'}
              </h2>
              {totalMedicines > 0 && <span className="badge badge-confirmed">{totalMedicines} found</span>}
            </div>

            {loadingSearch && medicines.length === 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                    <div className="skeleton" style={{ height: 180 }} />
                    <div style={{ padding: '1.25rem' }}>
                      <div className="skeleton" style={{ height: 20, marginBottom: '1rem', width: '70%' }} />
                      <div className="skeleton" style={{ height: 14, marginBottom: '0.75rem' }} />
                      <div className="skeleton" style={{ height: 14, width: '80%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : medicines.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--surface)', borderRadius: '20px', border: '1px dashed var(--border-light)' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔍</div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>No medicines found</h3>
                <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search terms or filters. We support typo-tolerance!</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                  {medicines.map((m, i) => (
                    <MedicineCard key={m.id} medicine={m} delay={i * 50} onClick={setSelectedMedicine} />
                  ))}
                </div>
                {hasNext && (
                  <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                    <button onClick={loadMore} disabled={loadingSearch} className="btn-secondary">
                      {loadingSearch ? <span className="spinner" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'var(--brand)' }} /> : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB: ORDERS */}
        {activeTab === 'orders' && (
          <div className="animate-fadeIn">
            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              {[
                { label: 'Total Orders', value: orders.length, color: 'var(--brand)', emoji: '📦' },
                { label: 'Successfully Delivered', value: delivered, color: '#10b981', emoji: '✅' },
                { label: 'Total Spent', value: `ETB ${totalSpent.toLocaleString()}`, color: '#0284c7', emoji: '💳' },
              ].map((s, i) => (
                <div key={i} className="card-hover" style={{ borderRadius: '16px', padding: '1.5rem' }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{s.emoji}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: s.color }}>{s.value}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem', fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>Recent Orders</h2>

            {loadingOrders ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: '16px' }} />)}
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--surface)', borderRadius: '20px', border: '1px dashed var(--border-light)' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📭</div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>No orders yet</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Start finding medicines to see your history here.</p>
                <button onClick={() => setActiveTab('search')} className="btn-primary">Browse Medicines</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {orders.map(order => (
                  <div key={order.id} className="card-hover" style={{ borderRadius: '16px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Order #{order.id}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '1rem' }}>
                          {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <span className={`badge badge-${order.status}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                        {STATUS_ICON[order.status]} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                      {order.items.map(item => (
                        <span key={item.id} style={{ background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.85rem', fontWeight: 500 }}>
                          {item.medicine.name} <span style={{ color: 'var(--brand)', marginLeft: '0.2rem' }}>×{item.quantity}</span>
                        </span>
                      ))}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginRight: '0.75rem' }}>Total Amount:</span>
                      <span style={{ fontWeight: 800, color: 'var(--brand)', fontSize: '1.1rem' }}>
                        ETB {Number(order.total_price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* TAB: AI GUIDE */}
        {activeTab === 'ai' && (
          <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 260px)', minHeight: 500 }}>
            <div style={{ background: 'linear-gradient(135deg, #0a1a16, #0f766e)', borderRadius: '20px 20px 0 0', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={22} color="#4ade80" />
              </div>
              <div>
                <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>AI Health Guide</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <Activity size={12} color="#4ade80" />
                  <span style={{ color: '#86efac', fontSize: '0.78rem', fontWeight: 600 }}>Powered by Gemini AI</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-light)' }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: msg.role === 'user' ? 'linear-gradient(135deg, #0d9488, #16a34a)' : '#0a1a16', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {msg.role === 'user'
                      ? <span style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>You</span>
                      : <Bot size={17} color="#4ade80" />}
                  </div>
                  <div style={{ maxWidth: '80%' }}>
                    <div style={{
                      background: msg.role === 'user' ? 'linear-gradient(135deg, #0d9488, #16a34a)' : 'var(--bg-color)',
                      color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '0.9rem 1.1rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      border: msg.role === 'assistant' ? '1px solid var(--border-light)' : 'none',
                      lineHeight: 1.7, fontSize: '0.9rem', whiteSpace: 'pre-wrap'
                    }}>{msg.text}</div>
                    {msg.role === 'assistant' && msg.ai_powered === false && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem', color: '#f59e0b', fontSize: '0.73rem', fontWeight: 600 }}>
                        <AlertTriangle size={12} /> Fallback (AI unavailable)
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0a1a16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={17} color="#4ade80" />
                  </div>
                  <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '0.9rem 1.1rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#0d9488', animation: `pulse 1.2s ${i*0.2}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendAiMessage} style={{ display: 'flex', gap: '0.75rem', padding: '1rem 1.25rem', background: 'var(--surface)', borderTop: '1px solid var(--border-light)', borderRadius: '0 0 20px 20px', border: '1px solid var(--border-light)', borderTop: 'none' }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Describe your symptoms, e.g. headache, fever, sore throat…"
                style={{ flex: 1, border: '1.5px solid var(--border-light)', borderRadius: '12px', padding: '0.8rem 1.1rem', fontSize: '0.92rem', outline: 'none', fontFamily: 'var(--font-body)', background: 'var(--bg-color)', color: 'var(--text-main)' }}
                onFocus={e => (e.target.style.borderColor = 'var(--brand)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-light)')}
              />
              <button type="submit" disabled={chatLoading || !chatInput.trim()} className="btn-primary" style={{ padding: '0.8rem 1.25rem' }}>
                <Send size={18} />
              </button>
            </form>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.5rem', paddingBottom: '0.5rem' }}>
              ⚕️ For guidance only — always consult a licensed medical professional.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

/* Inline animation for AI bubbles */
const _style = typeof document !== 'undefined' && !document.getElementById('ai-pulse-style') && (() => {
  const s = document.createElement('style');
  s.id = 'ai-pulse-style';
  s.textContent = '@keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }';
  document.head.appendChild(s);
})();