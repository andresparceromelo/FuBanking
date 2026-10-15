'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ACTION_BLOCKS, ActionBlock } from '../data/uxSurveyData';
import {
  CheckSquare,
  Square,
  RotateCcw,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';

const STORAGE_KEY = 'fubank_ux_tasks_state_v1';

export function UxActionBoard() {
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});
  const [filterState, setFilterState] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Cargar estado inicial desde localStorage o valores por defecto
  useEffect(() => {
    setIsClient(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCompletedMap(JSON.parse(stored));
        return;
      }
    } catch {
      // Ignorar fallos de lectura
    }

    // Inicializar con valores predeterminados
    const initialMap: Record<string, boolean> = {};
    ACTION_BLOCKS.forEach(block => {
      block.tasks.forEach(task => {
        initialMap[task.id] = task.defaultCompleted;
      });
    });
    setCompletedMap(initialMap);
  }, []);

  // Guardar en localStorage ante cualquier cambio
  const toggleTask = (taskId: string) => {
    setCompletedMap(prev => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignorar fallos de escritura
      }
      return next;
    });
  };

  const resetAllTasks = () => {
    const initialMap: Record<string, boolean> = {};
    ACTION_BLOCKS.forEach(block => {
      block.tasks.forEach(task => {
        initialMap[task.id] = task.defaultCompleted;
      });
    });
    setCompletedMap(initialMap);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMap));
    } catch {
      // Ignorar
    }
  };

  // Métricas globales
  const allTasks = useMemo(() => ACTION_BLOCKS.flatMap(b => b.tasks), []);
  const totalTasksCount = allTasks.length;
  const totalCompletedCount = useMemo(() => {
    return allTasks.filter(t => completedMap[t.id]).length;
  }, [allTasks, completedMap]);

  const globalPercent = totalTasksCount > 0 ? Math.round((totalCompletedCount / totalTasksCount) * 100) : 0;

  // Filtrado de bloques y tareas
  const filteredBlocks = useMemo(() => {
    return ACTION_BLOCKS.map(block => {
      const matchedTasks = block.tasks.filter(task => {
        const isDone = Boolean(completedMap[task.id]);
        if (filterState === 'pending' && isDone) return false;
        if (filterState === 'completed' && !isDone) return false;

        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = task.description.toLowerCase().includes(q);
          const matchHeuristic = task.heuristic.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchHeuristic) return false;
        }

        return true;
      });

      return {
        ...block,
        filteredTasks: matchedTasks,
      };
    });
  }, [completedMap, filterState, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Encabezado del Pizarrón Compartido */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-2">
              <Layers size={13} />
              Pizarrón Compartido de Mejora Continua UI/UX
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-foreground">
              Hoja de Ruta Operativa: Tareas por Bloques con Checklists
            </h2>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Cajones de trabajo interactivos derivados de las 5 encuestas. Puedes marcar o desmarcar cada ítem
              para actualizar el progreso del sprint en tiempo real. Los cambios se conservan en tu navegador.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={resetAllTasks}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Restablecer el estado predeterminado de las tareas"
            >
              <RotateCcw size={13} />
              Restablecer
            </button>
          </div>
        </div>

        {/* Barra de Progreso Global */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary" />
              Progreso General de Remediación
            </span>
            <span className="font-black text-foreground">
              {totalCompletedCount} de {totalTasksCount} tareas completadas ({globalPercent}%)
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
              style={{ width: `${globalPercent}%` }}
            />
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar tarea o heurística..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex items-center gap-1 self-stretch sm:self-auto justify-end">
            <span className="text-xs text-muted-foreground mr-1 hidden sm:inline flex items-center gap-1">
              <Filter size={12} /> Filtrar:
            </span>
            {(['all', 'pending', 'completed'] as const).map(state => {
              const label = state === 'all' ? 'Todas' : state === 'pending' ? 'Pendientes' : 'Completadas';
              return (
                <button
                  key={state}
                  onClick={() => setFilterState(state)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterState === state
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid de Cajones Grandes (Whiteboard Boxes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredBlocks.map(block => {
          const totalInBlock = block.tasks.length;
          const completedInBlock = block.tasks.filter(t => completedMap[t.id]).length;
          const blockPercent = totalInBlock > 0 ? Math.round((completedInBlock / totalInBlock) * 100) : 0;

          // Color del cajón
          const borderStyle =
            block.colorScheme === 'red'
              ? 'border-rose-500/30 dark:border-rose-500/20'
              : block.colorScheme === 'amber'
              ? 'border-amber-500/30 dark:border-amber-500/20'
              : block.colorScheme === 'blue'
              ? 'border-blue-500/30 dark:border-blue-500/20'
              : block.colorScheme === 'purple'
              ? 'border-purple-500/30 dark:border-purple-500/20'
              : block.colorScheme === 'emerald'
              ? 'border-emerald-500/30 dark:border-emerald-500/20'
              : 'border-indigo-500/30 dark:border-indigo-500/20';

          const badgeBg =
            block.colorScheme === 'red'
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              : block.colorScheme === 'amber'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              : block.colorScheme === 'blue'
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
              : block.colorScheme === 'purple'
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
              : block.colorScheme === 'emerald'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';

          const progressBarColor =
            block.colorScheme === 'red'
              ? 'bg-rose-500'
              : block.colorScheme === 'amber'
              ? 'bg-amber-500'
              : block.colorScheme === 'blue'
              ? 'bg-blue-500'
              : block.colorScheme === 'purple'
              ? 'bg-purple-500'
              : block.colorScheme === 'emerald'
              ? 'bg-emerald-500'
              : 'bg-indigo-500';

          return (
            <div
              key={block.id}
              className={`rounded-2xl border-2 ${borderStyle} bg-card p-6 shadow-sm flex flex-col justify-between space-y-5 transition-all hover:shadow-md`}
            >
              <div className="space-y-3">
                {/* Cabecera del Cajón */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeBg}`}>
                      {block.badge}
                    </span>
                    <h3 className="text-base font-bold text-foreground">{block.title}</h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-foreground">
                      {completedInBlock} / {totalInBlock}
                    </span>
                    <div className="text-[10px] text-muted-foreground">{blockPercent}% listo</div>
                  </div>
                </div>

                {/* Barra de progreso por cajón */}
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${progressBarColor} transition-all duration-300`}
                    style={{ width: `${blockPercent}%` }}
                  />
                </div>

                <p className="text-xs text-muted-foreground">{block.description}</p>
                <div className="text-[11px] text-muted-foreground/80 font-mono flex items-center gap-1">
                  <span className="font-semibold text-foreground">Sustento empírico: </span>
                  {block.instrumentBacking}
                </div>
              </div>

              {/* Lista interactiva de tareas (Checklist) */}
              <div className="space-y-2.5 pt-2 border-t border-border/60">
                {block.filteredTasks.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No hay tareas en este bloque que coincidan con el filtro actual.
                  </div>
                ) : (
                  block.filteredTasks.map(task => {
                    const isChecked = Boolean(completedMap[task.id]);
                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isChecked
                            ? 'bg-muted/30 border-border/40 opacity-75'
                            : 'bg-background hover:bg-muted/40 border-border shadow-xs'
                        }`}
                      >
                        <div className="pt-0.5 text-primary shrink-0">
                          {isChecked ? (
                            <CheckSquare size={18} className="text-emerald-500" />
                          ) : (
                            <Square size={18} className="text-muted-foreground hover:text-foreground" />
                          )}
                        </div>

                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span
                              className={`text-xs font-bold leading-tight ${
                                isChecked ? 'line-through text-muted-foreground' : 'text-foreground'
                              }`}
                            >
                              {task.title}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {task.effort}
                              </span>
                            </div>
                          </div>

                          <p
                            className={`text-[11px] leading-relaxed ${
                              isChecked ? 'text-muted-foreground/70' : 'text-muted-foreground'
                            }`}
                          >
                            {task.description}
                          </p>

                          <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
                            <span className="font-medium text-foreground">{task.heuristic}</span>
                            <span>•</span>
                            <span className="font-semibold">{task.severity}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pie de cajón con resumen rápido */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40">
                <span>{block.tasks.length} tareas programadas</span>
                <span className="text-primary font-semibold flex items-center gap-1">
                  Ver especificación en APA v7 <ArrowRight size={11} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
