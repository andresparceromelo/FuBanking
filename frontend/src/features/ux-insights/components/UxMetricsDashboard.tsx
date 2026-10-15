'use client';

import React, { useState } from 'react';
import {
  UX_COVER_DATA,
  UX_SURVEY_SOURCES,
  QUIM_DIMENSIONS,
  SAM_DIMENSIONS,
  SUMI_SUBSCALES,
  UES_SUBSCALES,
  GRIHO_SUMMARY,
  CRITICAL_SURVEY_ITEMS,
} from '../data/uxSurveyData';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Users,
  ShieldCheck,
  EyeOff,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';

export function UxMetricsDashboard() {
  const [selectedTab, setSelectedTab] = useState<'QUIM' | 'SAM' | 'SUMI' | 'UES' | 'GRIHO'>('QUIM');

  return (
    <div className="space-y-8">
      {/* Portada APA Institucional */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 border border-border p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              <Sparkles size={13} />
              {UX_COVER_DATA.title} · Versión {UX_COVER_DATA.version}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-foreground">
              Diagnóstico de Usabilidad y Experiencia de Usuario ({UX_COVER_DATA.project})
            </h1>
            <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
              {UX_COVER_DATA.subtitle}. Evaluación multidimensional con muestra oficial consolidada de{' '}
              <strong className="text-foreground">N = 20 encuestados</strong> por instrumento y análisis crítico para
              alcanzar estándares de clase mundial (ISO/IEC 25010 y WCAG 2.1 AA).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 text-xs text-muted-foreground bg-background/80 p-4 rounded-xl border border-border">
            <div>
              <span className="font-semibold text-foreground">Fecha: </span>
              {UX_COVER_DATA.date}
            </div>
            <div>
              <span className="font-semibold text-foreground">Equipo de Pruebas: </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {UX_COVER_DATA.team.map(member => (
                  <span
                    key={member}
                    className="inline-block px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground"
                  >
                    {member}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enlaces rápidos a fuentes Google Forms / Sheets */}
        <div className="mt-6 pt-4 border-t border-border/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground font-semibold flex items-center gap-1 mr-2">
            <FileSpreadsheet size={14} className="text-primary" /> Fuentes Oficiales:
          </span>
          {UX_SURVEY_SOURCES.map(source => (
            <a
              key={source.name}
              href={source.sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border text-[11px] transition-colors"
              title={`Ver hoja de cálculo de ${source.title}`}
            >
              <span>{source.name}</span>
              <span className="text-[10px] text-primary font-bold">({source.score})</span>
              <ExternalLink size={11} />
            </a>
          ))}
        </div>
      </div>

      {/* KPI Cards Críticos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Muestra Oficial</span>
            <Users size={18} className="text-primary" />
          </div>
          <div className="text-3xl font-black text-foreground">N = 20</div>
          <p className="text-xs text-muted-foreground">100% completitud en los 5 instrumentos psicométricos.</p>
        </div>

        <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Mayor Fortaleza</span>
            <TrendingUp size={18} />
          </div>
          <div className="text-3xl font-black text-foreground">4.19 / 5.0</div>
          <p className="text-xs text-muted-foreground">
            Eficiencia QUIM y <strong>7.75 / 9.0</strong> en Dominancia/Control SAM.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-rose-500/20 bg-rose-500/5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Brecha Crítica #1</span>
            <AlertTriangle size={18} />
          </div>
          <div className="text-3xl font-black text-foreground">1.84 / 5.0</div>
          <p className="text-xs text-muted-foreground">
            Accesibilidad QUIM e Ítem 28 (Contraste y fuente: <strong>1.73</strong>).
          </p>
        </div>

        <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Brecha Crítica #2</span>
            <ShieldCheck size={18} />
          </div>
          <div className="text-3xl font-black text-foreground">100% NO</div>
          <p className="text-xs text-muted-foreground">
            GRIHO Q30 y Q34: Sin modales de confirmación para acciones irreversibles.
          </p>
        </div>
      </div>

      {/* Selector de Instrumento y Gráficas Interactivas */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              Resultados Desglosados por Instrumento de Evaluación
            </h2>
            <p className="text-xs text-muted-foreground">
              Selecciona un instrumento para examinar los puntajes de sus dimensiones y subescalas psicométricas.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 p-1 bg-muted rounded-xl">
            {(['QUIM', 'SAM', 'SUMI', 'UES', 'GRIHO'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedTab === tab
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: QUIM */}
        {selectedTab === 'QUIM' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Media Global QUIM: <strong className="text-foreground">3.34 / 5.0</strong> (29 reactivos evaluados)
              </span>
              <span className="text-xs text-muted-foreground">Escala Likert: 1 (Deficiente) a 5 (Óptimo)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {QUIM_DIMENSIONS.map(d => {
                const percent = (d.score / d.maxScore) * 100;
                const barColor =
                  d.status === 'excelente'
                    ? 'bg-emerald-500'
                    : d.status === 'bueno'
                    ? 'bg-blue-500'
                    : d.status === 'regular'
                    ? 'bg-amber-500'
                    : 'bg-rose-500';
                return (
                  <div key={d.name} className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{d.name}</span>
                      <span className="text-xs font-black text-foreground">
                        {d.score.toFixed(2)} / {d.maxScore}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{d.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: SAM */}
        {selectedTab === 'SAM' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Media Global SAM: <strong className="text-foreground">6.17 / 9.0</strong> (9 reactivos pictográficos)
              </span>
              <span className="text-xs text-muted-foreground">Escala Diferencial Semántica 1 a 9</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SAM_DIMENSIONS.map(d => {
                const percent = (d.score / d.maxScore) * 100;
                return (
                  <div key={d.name} className="p-5 rounded-xl border border-border bg-background space-y-3 text-center">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{d.name}</div>
                    <div className="text-4xl font-black text-foreground">{d.score.toFixed(2)}</div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{d.description}</p>
                  </div>
                );
              })}
            </div>
            <div className="p-4 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Diagnóstico Afectivo: </strong>
              Los usuarios experimentan una elevada sensación de control (<strong className="text-foreground">7.78 / 9.0</strong>) y
              tranquilidad operativa (<strong className="text-foreground">6.18 / 9.0</strong>), lo cual es ideal en banca. Sin embargo, la
              excitación afectiva (Arousal <strong className="text-foreground">4.69 / 9.0</strong>) refleja que la interfaz es neutra y
              utilitaria, presentando una oportunidad para incorporar micro-interacciones de éxito y diseño emocional.
            </div>
          </div>
        )}

        {/* Tab 3: SUMI */}
        {selectedTab === 'SUMI' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Media Global SUMI: <strong className="text-foreground">3.39 / 5.0</strong> (50 reactivos psicométricos)
              </span>
              <span className="text-xs text-muted-foreground">Validación psicométrica con ítems directos e inversos</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SUMI_SUBSCALES.map(sub => {
                const percent = (sub.score / sub.maxScore) * 100;
                const barColor =
                  sub.status === 'excelente'
                    ? 'bg-emerald-500'
                    : sub.status === 'bueno'
                    ? 'bg-blue-500'
                    : 'bg-rose-500';
                return (
                  <div key={sub.name} className="p-3.5 rounded-xl border border-border bg-background/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{sub.name}</span>
                      <span className="text-xs font-black text-foreground">
                        {sub.score.toFixed(2)} / {sub.maxScore}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{sub.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: UES */}
        {selectedTab === 'UES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Media Global UES: <strong className="text-foreground">3.29 / 5.0</strong> (22 reactivos)
              </span>
              <span className="text-xs text-muted-foreground">Modelo de Engagement O&apos;Brien et al. (2018)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {UES_SUBSCALES.map(sub => {
                const percent = (sub.score / sub.maxScore) * 100;
                return (
                  <div key={sub.name} className="p-4 rounded-xl border border-border bg-background space-y-2">
                    <div className="text-xs font-bold text-foreground">{sub.name}</div>
                    <div className="text-2xl font-black text-foreground">{sub.score.toFixed(2)} / 5.0</div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{sub.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 5: GRIHO */}
        {selectedTab === 'GRIHO' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Inspección Heurística GRIHO: <strong className="text-foreground">60 reactivos × 20 evaluadores</strong> (1,200 juicios totales)
              </span>
              <span className="text-xs text-muted-foreground">Cumplimiento Positivo Global: 56.2%</span>
            </div>

            {/* Barra apilada de porcentaje global */}
            <div className="space-y-2">
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-muted">
                <div style={{ width: `${GRIHO_SUMMARY.yesPercent}%` }} className="bg-emerald-500 h-full" title="SÍ (35.4%)" />
                <div style={{ width: `${GRIHO_SUMMARY.partialPercent}%` }} className="bg-blue-500 h-full" title="Parcial (20.8%)" />
                <div style={{ width: `${GRIHO_SUMMARY.notAlwaysPercent}%` }} className="bg-amber-500 h-full" title="No siempre (11.2%)" />
                <div style={{ width: `${GRIHO_SUMMARY.noPercent}%` }} className="bg-rose-500 h-full" title="NO (21.8%)" />
                <div style={{ width: `${GRIHO_SUMMARY.naPercent}%` }} className="bg-muted-foreground/30 h-full" title="No aplica (10.8%)" />
              </div>

              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">SÍ en todos los casos: <strong className="text-foreground">35.4%</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Parcial: <strong className="text-foreground">20.8%</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">No siempre: <strong className="text-foreground">11.2%</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-muted-foreground">NO en ningún caso: <strong className="text-foreground">21.8%</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                  <span className="text-muted-foreground">No aplica: <strong className="text-foreground">10.8%</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de Focos Rojos: Top 10 Hallazgos Críticos */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <EyeOff size={18} className="text-rose-500" />
              Focos Rojos Prioritarios: Top 10 Hallazgos Críticos Consolidados
            </h2>
            <p className="text-xs text-muted-foreground">
              Reactivos de menor puntuación empírica en las 5 encuestas que justifican de forma directa el plan de mejora.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="py-2.5 px-3 font-semibold">Instrumento / Ítem</th>
                <th className="py-2.5 px-3 font-semibold">Pregunta Evaluada</th>
                <th className="py-2.5 px-3 font-semibold">Evidencia Estadística</th>
                <th className="py-2.5 px-3 font-semibold">Severidad</th>
                <th className="py-2.5 px-3 font-semibold">Acción Recomendada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {CRITICAL_SURVEY_ITEMS.map(item => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3 font-bold whitespace-nowrap text-foreground">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] mr-1.5">
                      {item.instrument}
                    </span>
                    #{item.questionNumber}
                  </td>
                  <td className="py-3 px-3 max-w-xs text-foreground font-medium">{item.question}</td>
                  <td className="py-3 px-3 text-muted-foreground whitespace-nowrap font-mono">{item.metric}</td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.severity.startsWith('Catastrófica')
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : item.severity.startsWith('Mayor')
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">{item.recommendedAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
