'use client';

import React from 'react';
import { UxMetricsDashboard } from '@/features/ux-insights/components/UxMetricsDashboard';
import { UxActionBoard } from '@/features/ux-insights/components/UxActionBoard';

export default function UxReportPage() {
  return (
    <div className="space-y-12 pb-16">
      {/* Sección 1: Dashboard de Métricas y Diagnóstico Crítico */}
      <section aria-label="Dashboard de Métricas UX">
        <UxMetricsDashboard />
      </section>

      {/* Sección 2: Cajones Grandes Tipo Pizarrón Compartido con Checklists */}
      <section aria-label="Pizarrón Compartido de Tareas UI/UX">
        <UxActionBoard />
      </section>
    </div>
  );
}
