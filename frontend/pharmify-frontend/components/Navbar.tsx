'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Bell, User, LogOut, Menu, X, Pill } from 'lucide-react';
import { authService } from '@/services/auth';
import type { User as UserType } from '@/types';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setUser(authService.getUser());
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function logout() {
    authService.logout();
    setUser(null);
    router.push('/');
  }

  function getDashboardLink() {
    if (!user) return '/auth';
    if (user.role === 'admin') return '/dashboard/admin';
    if (user.role === 'owner') return '/dashboard/owner';
    return '/dashboard/customer';
  }

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: scrolled ? '1px solid #d1ebe6' : '1px solid transparent',
        transition: 'all .3s ease',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70 }}>
        
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg,#0d9488,#16a34a)', borderRadius: 10, padding: '6px 8px', display: 'flex' }}>
            <Pill size={20} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', background: 'linear-gradient(135deg,#0d9488,#16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Pharmasify
          </span>
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }} className="hidden-mobile">
          {user && <Link href="/cart" style={{ color: '#374151', textDecoration: 'none', fontWeight: 500, fontSize: '.95rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}><ShoppingCart size={17} />Cart</Link>}
          {user && <Link href={getDashboardLink()} style={{ color: '#374151', textDecoration: 'none', fontWeight: 500, fontSize: '.95rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}><User size={17} />Dashboard</Link>}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', background: '#f0fdfa', borderRadius: 999, padding: '.35rem .9rem', border: '1px solid #d1ebe6' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#0d9488,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '.8rem' }}>
                  {user.username[0].toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, fontSize: '.85rem', color: '#0f766e' }}>{user.username}</span>
              </div>
              <button onClick={logout} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '.4rem .75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.3rem', color: '#6b7280', fontSize: '.85rem' }}>
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <Link href="/auth" className="btn-primary" style={{ textDecoration: 'none', padding: '.5rem 1.25rem', fontSize: '.9rem' }}>
              Sign In
            </Link>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer' }} className="mobile-menu-btn">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: 'white', borderTop: '1px solid #d1ebe6', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {user && <Link href="/cart" onClick={() => setMenuOpen(false)} style={{ color: '#374151', textDecoration: 'none', fontWeight: 500 }}>Cart</Link>}
          {user && <Link href={getDashboardLink()} onClick={() => setMenuOpen(false)} style={{ color: '#374151', textDecoration: 'none', fontWeight: 500 }}>Dashboard</Link>}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}