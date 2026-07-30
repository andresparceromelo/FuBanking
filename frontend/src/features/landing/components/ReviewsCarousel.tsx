'use client';

import { motion } from 'framer-motion';
import { StarRating } from './StarRating';

const reviews = [
  {
    name: 'María García',
    initials: 'MG',
    rating: 5,
    comment: 'Increíble cómo de fácil es transferir dinero. Ya no uso otros bancos para mis envíos.',
  },
  {
    name: 'Carlos Rodríguez',
    initials: 'CR',
    rating: 5,
    comment: 'Las tarjetas virtuales me dieron mucha tranquilidad para comprar online. Super seguro.',
  },
  {
    name: 'Laura Martínez',
    initials: 'LM',
    rating: 4,
    comment: 'Los bolsillos son perfectos para ahorrar. Puedo ver mi progreso en tiempo real.',
  },
  {
    name: 'Andrés López',
    initials: 'AL',
    rating: 5,
    comment: 'Simulé un crédito y lo aprobé en minutos. Tasas claras sin sorpresas.',
  },
  {
    name: 'Sofía Hernández',
    initials: 'SH',
    rating: 5,
    comment: 'Pago todos mis servicios desde la app. Ahorra mucho tiempo y es muy fácil.',
  },
  {
    name: 'Diego Sánchez',
    initials: 'DS',
    rating: 4,
    comment: 'La mejor experiencia bancaria digital que he probado. Todo funciona perfecto.',
  },
];

export function ReviewsCarousel() {
  const duplicatedReviews = [...reviews, ...reviews];

  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Lo que dicen nuestros usuarios
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Miles de personas ya confían en FuBank para su day a day financiero.
          </p>
        </motion.div>
      </div>

      <div className="overflow-hidden">
        <div className="flex gap-6 animate-reviews-scroll hover:[animation-play-state:paused] w-max">
          {duplicatedReviews.map((review, i) => (
            <div
              key={`${review.name}-${i}`}
              className="shrink-0 w-[320px] bg-card border border-border rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {review.initials}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">{review.name}</p>
                  <StarRating rating={review.rating} />
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                &ldquo;{review.comment}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
