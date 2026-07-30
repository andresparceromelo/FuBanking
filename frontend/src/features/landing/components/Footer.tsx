'use client';

import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="py-16 px-6 bg-[#0a0a1a]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo.png"
                alt="FuBank"
                width={40}
                height={40}
                className="rounded-xl"
              />
              <h3 className="text-2xl font-black text-white font-display tracking-[0.06em] uppercase">
                Fubank
              </h3>
            </div>
            <p className="text-white/50 max-w-sm leading-relaxed">
              Banca digital segura, rápida y sin complicaciones. Tu dinero bajo tu control.
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <h4 className="text-white font-semibold mb-4">Producto</h4>
              <ul className="space-y-3">
                <li><span className="text-white/50 hover:text-white/70 transition-colors cursor-pointer">Cuentas</span></li>
                <li><span className="text-white/50 hover:text-white/70 transition-colors cursor-pointer">Transferencias</span></li>
                <li><span className="text-white/50 hover:text-white/70 transition-colors cursor-pointer">Tarjetas</span></li>
                <li><span className="text-white/50 hover:text-white/70 transition-colors cursor-pointer">Créditos</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Cuenta</h4>
              <ul className="space-y-3">
                <li><Link href="/login" className="text-white/50 hover:text-white/70 transition-colors">Iniciar sesión</Link></li>
                <li><Link href="/register" className="text-white/50 hover:text-white/70 transition-colors">Crear cuenta</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-sm">&copy; 2026 FuBank. Todos los derechos reservados.</p>
          <p className="text-white/30 text-sm">Hecho con amor para la comunidad</p>
        </div>
      </div>
    </footer>
  );
}
