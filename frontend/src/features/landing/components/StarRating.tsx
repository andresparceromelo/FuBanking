'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  max?: number;
}

export function StarRating({ rating, max = 5 }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={16}
          className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}
        />
      ))}
    </div>
  );
}
