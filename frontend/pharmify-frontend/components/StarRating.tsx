'use client';
import { Star } from 'lucide-react';

interface Props {
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (r: number) => void;
}

export default function StarRating({ rating, max = 5, size = 16, interactive = false, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.round(rating);
        return (
          <Star
            key={i}
            size={size}
            fill={filled ? '#f59e0b' : 'none'}
            color={filled ? '#f59e0b' : '#d1d5db'}
            style={{ cursor: interactive ? 'pointer' : 'default', transition: 'transform .15s' }}
            onClick={() => interactive && onChange && onChange(i + 1)}
            onMouseEnter={(e) => { if (interactive) (e.currentTarget as SVGSVGElement).style.transform = 'scale(1.2)'; }}
            onMouseLeave={(e) => { if (interactive) (e.currentTarget as SVGSVGElement).style.transform = 'scale(1)'; }}
          />
        );
      })}
    </div>
  );
}