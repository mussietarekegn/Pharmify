'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { authService } from '@/services/auth';
import { Send, Bot, User, AlertTriangle, Zap, Activity } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  ai_powered?: boolean;
}

export default function AIGuidePage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hello! I\'m your Pharmify AI health assistant. Describe your symptoms and I\'ll suggest possible conditions and recommended medicine categories. Remember, this is for guidance only — always consult a doctor for serious concerns.', ai_powered: true }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authService.isLoggedIn()) {
      router.push('/auth');
    }
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const symptoms = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: symptoms }]);
    setLoading(true);
    try {
      const res = await api.aiGuide(symptoms);
      setMessages(prev => [...prev, { role: 'assistant', text: res.response, ai_powered: res.ai_powered }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I could not process your request. Please try again.', ai_powered: false }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#f0fdfa 0%,#f8fffe 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0a1a16,#0f766e)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: 999, padding: '.4rem 1rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.15)' }}>
          <Activity size={14} color="#4ade80" />
          <span style={{ color: '#86efac', fontSize: '.8rem', fontWeight: 600 }}>Powered by Gemini AI</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: 'white', marginBottom: '.5rem' }}>AI Health Guide</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '.9rem', maxWidth: 500, margin: '0 auto' }}>
          Describe your symptoms for personalized medicine guidance. Not a substitute for professional medical advice.
        </p>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, maxWidth: 760, width: '100%', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, i) => (
          <div key={i} className="animate-slideIn" style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', animationDelay: `${i * 50}ms` }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: msg.role === 'user' ? 'linear-gradient(135deg,#0d9488,#16a34a)' : '#0a1a16', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {msg.role === 'user' ? <User size={18} color="white" /> : <Bot size={18} color="#4ade80" />}
            </div>
            <div style={{ maxWidth: '80%' }}>
              <div style={{
                background: msg.role === 'user' ? 'linear-gradient(135deg,#0d9488,#16a34a)' : 'white',
                color: msg.role === 'user' ? 'white' : '#0a1a16',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '1rem 1.25rem',
                boxShadow: '0 4px 16px rgba(0,0,0,.07)',
                border: msg.role === 'assistant' ? '1px solid #e8f5f2' : 'none',
                lineHeight: 1.7,
                fontSize: '.92rem',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.text}
              </div>
              {msg.role === 'assistant' && msg.ai_powered === false && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', marginTop: '.35rem', color: '#f59e0b', fontSize: '.75rem', fontWeight: 600 }}>
                  <AlertTriangle size={13} /> Fallback response (AI service unavailable)
                </div>
              )}
              {msg.role === 'assistant' && msg.ai_powered === true && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', marginTop: '.35rem', color: '#0d9488', fontSize: '.75rem', fontWeight: 600 }}>
                  <Zap size={13} /> AI-powered response
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0a1a16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} color="#4ade80" />
            </div>
            <div style={{ background: 'white', border: '1px solid #e8f5f2', borderRadius: '16px 16px 16px 4px', padding: '1rem 1.25rem', display: 'flex', gap: '.3rem', alignItems: 'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d9488', animation: `pulse 1.2s ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: 'white', borderTop: '1px solid #e8f5f2', padding: '1rem 1.5rem' }}>
        <form onSubmit={send} style={{ maxWidth: 760, margin: '0 auto', display: 'flex', gap: '.75rem' }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="Describe your symptoms, e.g. headache, fever, sore throat..."
            style={{ flex: 1, border: '1.5px solid #d1ebe6', borderRadius: 12, padding: '.85rem 1.25rem', fontSize: '.95rem', outline: 'none', fontFamily: 'var(--font-body)' }}
            onFocus={e => (e.target.style.borderColor = '#0d9488')}
            onBlur={e => (e.target.style.borderColor = '#d1ebe6')}
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn-primary" style={{ padding: '.85rem 1.5rem' }}>
            <Send size={18} />
          </button>
        </form>
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '.75rem', marginTop: '.75rem', maxWidth: 760, margin: '.5rem auto 0' }}>
          ⚕️ This AI provides general guidance only. Always consult a licensed medical professional for diagnosis and treatment.
        </p>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: .3; transform: scale(.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}