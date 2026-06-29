'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface Props {
  onSearch: (params: Record<string, string>) => void;
}

export default function SearchBar({ onSearch }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [sort, setSort] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  // Debounced search — fires 300ms after user stops typing
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params: Record<string, string> = {};
      if (query)    params.search    = query;
      if (category) params.category  = category;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (minRating) params.min_rating = minRating;
      if (maxDistance) params.max_distance = maxDistance;
      if (sort)     params.sort      = sort;
      onSearch(params);
    }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query, category, minPrice, maxPrice, minRating, maxDistance, sort]);

  function clear() { setQuery(''); setCategory(''); setMinPrice(''); setMaxPrice(''); setMinRating(''); setMaxDistance(''); setSort(''); }

  const categories = ['Analgesics', 'Antibiotics', 'Antivirals', 'Vitamins', 'Antifungals', 'Antacids', 'Antihistamines', 'Other'];

  return (
    <div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>
      {/* Main search */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: 'white', borderRadius: 16, border: '2px solid #d1ebe6', boxShadow: '0 4px 24px rgba(13,148,136,.08)', overflow: 'hidden', transition: 'border-color .2s' }}
        onFocus={() => {}} 
      >
        <Search size={20} color="#0d9488" style={{ position: 'absolute', left: '1.25rem', flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search medicines, e.g. paracetamol, amoxicillin..."
          style={{
            flex: 1, border: 'none', outline: 'none', padding: '1rem 1rem 1rem 3.25rem',
            fontFamily: 'var(--font-body)', fontSize: '1rem', background: 'transparent',
            color: '#0a1a16',
          }}
        />
        {(query || category || minPrice || maxPrice || minRating || maxDistance) && (
          <button onClick={clear} style={{ background: 'none', border: 'none', padding: '.5rem', cursor: 'pointer', color: '#9ca3af' }}>
            <X size={18} />
          </button>
        )}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            background: showFilters ? '#f0fdfa' : 'none', border: 'none', borderLeft: '1px solid #e8f5f2',
            padding: '.75rem 1.25rem', cursor: 'pointer', color: showFilters ? '#0d9488' : '#6b7280',
            display: 'flex', alignItems: 'center', gap: '.4rem', fontWeight: 500, fontSize: '.9rem',
          }}
        >
          <SlidersHorizontal size={17} /> Filters
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="animate-fadeUp" style={{ background: 'white', borderRadius: 16, border: '1px solid #e8f5f2', marginTop: '.5rem', padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', boxShadow: '0 8px 24px rgba(13,148,136,.08)' }}>
          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#6b8f84', display: 'block', marginBottom: '.35rem' }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', border: '1px solid #d1ebe6', borderRadius: 8, padding: '.5rem', fontSize: '.875rem', outline: 'none', color: '#0a1a16' }}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#6b8f84', display: 'block', marginBottom: '.35rem' }}>Min Price (ETB)</label>
            <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0" style={{ width: '100%', border: '1px solid #d1ebe6', borderRadius: 8, padding: '.5rem', fontSize: '.875rem', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#6b8f84', display: 'block', marginBottom: '.35rem' }}>Max Price (ETB)</label>
            <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="99999" style={{ width: '100%', border: '1px solid #d1ebe6', borderRadius: 8, padding: '.5rem', fontSize: '.875rem', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#6b8f84', display: 'block', marginBottom: '.35rem' }}>Min Rating</label>
            <input type="number" step="0.5" min="0" max="5" value={minRating} onChange={e => setMinRating(e.target.value)} placeholder="0" style={{ width: '100%', border: '1px solid #d1ebe6', borderRadius: 8, padding: '.5rem', fontSize: '.875rem', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#6b8f84', display: 'block', marginBottom: '.35rem' }}>Max Distance (km)</label>
            <input type="number" min="0" value={maxDistance} onChange={e => setMaxDistance(e.target.value)} placeholder="Any" style={{ width: '100%', border: '1px solid #d1ebe6', borderRadius: 8, padding: '.5rem', fontSize: '.875rem', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#6b8f84', display: 'block', marginBottom: '.35rem' }}>Sort By</label>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ width: '100%', border: '1px solid #d1ebe6', borderRadius: 8, padding: '.5rem', fontSize: '.875rem', outline: 'none', color: '#0a1a16' }}>
              <option value="">Default</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="distance">Distance (Nearest)</option>
              <option value="rating">Rating (Highest)</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}