import { Hero } from '@/features/landing/components/Hero';
import { FeaturesCarousel } from '@/features/landing/components/FeaturesCarousel';
import { ReviewsCarousel } from '@/features/landing/components/ReviewsCarousel';
import { Footer } from '@/features/landing/components/Footer';

export default function Home() {
  return (
    <main>
      <Hero />
      <FeaturesCarousel />
      <ReviewsCarousel />
      <Footer />
    </main>
  );
}
