'use client';
import Link from 'next/link';
import { Pill, Shield, Zap, ArrowRight, HeartPulse, Clock, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { authService } from '@/services/auth';

export default function LandingPage() {
  const [isClient, setIsClient] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    setIsLoggedIn(authService.isLoggedIn());
    const user = authService.getUser();
    if (user) {
      setUserRole(user.role);
    }
  }, []);

  const getDashboardLink = () => {
    if (userRole === 'admin') return '/dashboard/admin';
    if (userRole === 'owner') return '/dashboard/owner';
    return '/dashboard/customer';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
      
      {/* Navigation */}
      <nav style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--brand), #10b981)', borderRadius: '12px', padding: '0.6rem', display: 'flex' }}>
            <Pill size={24} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            Pharmasify
          </span>
        </div>
        
        {isClient && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            {isLoggedIn ? (
              <Link href={getDashboardLink()} className="btn-primary">
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link href="/auth" className="btn-secondary" style={{ padding: '0.6rem 1.5rem' }}>
                  Log In
                </Link>
                <Link href="/auth" className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section style={{ 
        position: 'relative', 
        padding: '6rem 1.5rem 8rem', 
        textAlign: 'center',
        overflow: 'hidden'
      }}>
        {/* Background Gradients */}
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '60vh', background: 'radial-gradient(circle, rgba(15,157,88,0.08) 0%, rgba(244,247,246,0) 70%)', zIndex: 0, pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto' }} className="animate-fadeUp">
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(15,157,88,0.1)', color: 'var(--brand)', padding: '0.4rem 1.25rem', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 600, marginBottom: '2rem', border: '1px solid rgba(15,157,88,0.2)' }}>
            <Sparkles size={16} /> Welcome to the future of pharmacy
          </div>

          <p style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: 'var(--text-main)', maxWidth: 740, margin: '0 auto 3rem', lineHeight: 1.6, fontWeight: 600 }}>
            Connect with verified local pharmacies, find typo-tolerant medicines instantly, and get AI-powered health guidance.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {isClient && isLoggedIn ? (
              <Link href={getDashboardLink()} className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                Enter Dashboard <ArrowRight size={20} />
              </Link>
            ) : (
              <Link href="/auth" className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                Create Free Account <ArrowRight size={20} />
              </Link>
            )}
            <Link href="#features" className="btn-secondary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '6rem 1.5rem', background: 'var(--surface)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Built for everyone.</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
              Whether you are looking for medicine, or looking to sell, Pharmasify provides a seamless, premium experience.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
            {[
              { icon: <Zap size={28} color="var(--brand)" />, title: 'Typo-Tolerant Search', desc: 'Misspelled a medicine name? No problem. Our advanced search engine finds exactly what you need, instantly.' },
              { icon: <Shield size={28} color="#0284c7" />, title: 'Verified Pharmacies', desc: 'Every pharmacy on our platform is manually verified by admins with valid license documents, ensuring your safety.' },
              { icon: <HeartPulse size={28} color="#e11d48" />, title: 'AI Health Guide', desc: 'Not sure what you need? Describe your symptoms to our AI assistant and get immediate medical guidance.' },
              { icon: <Clock size={28} color="#d97706" />, title: 'Real-Time Order Tracking', desc: 'Track your orders from pending to delivered with live updates directly in your customer dashboard.' },
            ].map((f, i) => (
              <div key={i} className="card-hover" style={{ padding: '2.5rem', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
                <div style={{ width: 60, height: 60, borderRadius: '16px', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Pill size={20} color="var(--brand)" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-main)', fontSize: '1.2rem' }}>Pharmasify</span>
        </div>
        <p>&copy; {new Date().getFullYear()} Pharmasify. All rights reserved.</p>
      </footer>
    </div>
  );
}