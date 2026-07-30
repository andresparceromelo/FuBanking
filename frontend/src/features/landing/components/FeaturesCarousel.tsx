'use client';

import { motion } from 'framer-motion';
import {
  Wallet,
  ArrowRightLeft,
  PiggyBank,
  CreditCard,
  Landmark,
  Receipt,
} from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'Cuentas Digitales',
    description: 'Crea y gestiona tus cuentas en segundos. Deposita, retira y controla tu saldo al instante.',
  },
  {
    icon: ArrowRightLeft,
    title: 'Transferencias',
    description: 'Envía dinero a cualquier usuario de forma rápida y segura. Sin comisiones ocultas.',
  },
  {
    icon: PiggyBank,
    title: 'Bolsillos',
    description: 'Organiza tu dinero en bolsillos para cada objetivo. Ahorra sin complicaciones.',
  },
  {
    icon: Landmark,
    title: 'Créditos',
    description: 'Simula y solicita créditos con tasas transparentes. Aprobación rápida y justa.',
  },
  {
    icon: CreditCard,
    title: 'Tarjetas Virtuales',
    description: 'Crea tarjetas virtuales para compras online. Bloquea, desbloquea y revela los datos cuando necesites.',
  },
  {
    icon: Receipt,
    title: 'Pagos de Servicios',
    description: 'Paga tus servicios directamente desde la app. Electricidad, agua, internet y más.',
  },
];

export function FeaturesCarousel() {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Todo lo que necesitas en un solo lugar
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Herramientas diseñadas para que tengas el control total de tu dinero.
          </p>
        </motion.div>

        <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide -mx-6 px-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="snap-center shrink-0 w-[280px] sm:w-[320px] bg-card border border-border rounded-2xl p-8 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-colors">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
