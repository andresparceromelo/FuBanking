'use client';

import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0a1a] via-[#0f0a20] to-background">
      {/* Background stars */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 40 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-star-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      {/* Nebula */}
      <div className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-primary/8 blur-[120px]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="text-6xl sm:text-8xl font-bold text-white mb-2 tracking-tight">
            fubank
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="text-xl sm:text-2xl text-white/60 mb-10 max-w-xl leading-relaxed"
        >
          Tu dinero, tu control. Banca digital segura y sin complicaciones.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link
            href="/register"
            className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Crear mi cuenta
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 border border-white/20 text-white rounded-full font-semibold text-lg hover:bg-white/5 transition-colors"
          >
            Iniciar sesión
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-10 flex flex-col items-center gap-2"
      >
        <span className="text-white/40 text-sm">Descubre más</span>
        <ArrowDown className="w-5 h-5 text-white/40 animate-bounce" />
      </motion.div>
    </section>
  );
}
