/**
 * Datos estadísticos consolidados y hoja de ruta de remediación UI/UX
 * Proyecto: FUBANK (Versión 2.0)
 * Fecha: 03/08/2026
 * Equipo de Pruebas: Andres Bedoya, Dubin Andres Soto, Tomas Henao, Stiven Alejandro Bustamante
 *
 * Muestra oficial: N = 20 encuestados por formulario (Google Forms + Google Sheets).
 */

export interface UxCoverInfo {
  title: string;
  subtitle: string;
  project: string;
  version: string;
  date: string;
  team: string[];
}

export interface DimensionMetric {
  name: string;
  score: number; // 0 - 5 or 0 - 9 or percentage
  maxScore: number;
  status: 'excelente' | 'bueno' | 'regular' | 'critico';
  description: string;
}

export interface CriticalSurveyItem {
  id: string;
  instrument: 'QUIM' | 'SAM' | 'SUMI' | 'UES' | 'GRIHO';
  questionNumber: number;
  question: string;
  metric: string;
  severity: 'Catastrófica (4)' | 'Mayor (3)' | 'Media (2)' | 'Cosmética (1)';
  impact: string;
  recommendedAction: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  severity: 'Catastrófica (4)' | 'Mayor (3)' | 'Media (2)' | 'Cosmética (1)';
  heuristic: string;
  effort: 'Bajo (1d)' | 'Medio (2-3d)' | 'Alto (4-5d)';
  defaultCompleted: boolean;
}

export interface ActionBlock {
  id: string;
  title: string;
  badge: string;
  colorScheme: 'red' | 'amber' | 'blue' | 'purple' | 'emerald' | 'indigo';
  instrumentBacking: string;
  description: string;
  tasks: TaskItem[];
}

export const UX_COVER_DATA: UxCoverInfo = {
  title: 'PLAN DE PRUEBAS',
  subtitle: 'Evaluación Psicométrica de Usabilidad, Experiencia Afectiva, Compromiso e Inspección Heurística',
  project: 'FUBANK',
  version: '2.0',
  date: '03/08/2026',
  team: ['Andres Bedoya', 'Dubin Andres Soto', 'Tomas Henao', 'Stiven Alejandro Bustamante'],
};

export const UX_SURVEY_SOURCES = [
  {
    name: 'QUIM',
    title: 'Quality in Use Integrated Measurement',
    items: 29,
    scale: 'Likert 1-5',
    respondents: 20,
    formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdneGOeRShssL2hrZSpSZ4ljiO1SrFcctwktIBT0muwNSOgFA/viewform',
    editUrl: 'https://docs.google.com/forms/d/1R_oeWHpG35CZi_oEgO0su_XSfprsJQcECCcOrdusdD8/edit',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1GNNmFavW2tE_a-GuBIMllvpg52CInRqqVZiZMhwnhOo/edit#gid=1891076943',
    score: '3.33 / 5.0',
  },
  {
    name: 'SAM',
    title: 'Self-Assessment Manikin (Afecto)',
    items: 9,
    scale: 'Pictográfica 1-9',
    respondents: 20,
    formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdUR_ZbfVBGBUhB9Rr5QO8CfkQCx5LjFwrMlUWB42RR7emkww/viewform',
    editUrl: 'https://docs.google.com/forms/d/1HigVK7n8BvdwSsD7X6zQ8QnhyjmNYfAWNDnFboN3zhk/edit',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1tE12DYRyRYYQI5H9vsU3UGODmt105jCt7zTmRwjVH-w/edit#gid=163162732',
    score: '6.15 / 9.0',
  },
  {
    name: 'SUMI',
    title: 'Software Usability Measurement Inventory',
    items: 50,
    scale: 'Likert 1-5',
    respondents: 20,
    formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfJzvmjR2vzP8W4yieIBpBLcw5V4N1IB8nFIjCQ7CS0bXtCTA/viewform',
    editUrl: 'https://docs.google.com/forms/d/1_VcjTG2FZScugf534_kd3gfbrcDPtmYHijLxxvEqwy4/edit',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1pDH0XAkSmJzvGOiyC3mD-GgLeRk1Bz4LmoViTDTjP7U/edit#gid=745407744',
    score: '3.37 / 5.0',
  },
  {
    name: 'UES',
    title: 'User Engagement Scale',
    items: 22,
    scale: 'Likert 1-5',
    respondents: 20,
    formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSeVZIDIKc5nFsuYxNW16eGHjFkeRKRFo1hfmtJFJ4gcdMdVPg/viewform',
    editUrl: 'https://docs.google.com/forms/d/1jXPWkJGiRsopeITUATk5VrXt527s6J4RLhYmNvKpsWM/edit',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1SrJpzwY54CumysOmyR0Zx-No-Z97ZiIRbPa3njX6XmU/edit#gid=1279260872',
    score: '3.27 / 5.0',
  },
  {
    name: 'GRIHO',
    title: 'Inspección Heurística Nielsen (GRIHO)',
    items: 60,
    scale: 'Categórica (SÍ, Parcial, NO)',
    respondents: 20,
    formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSewfH9b4G_9y-4Yd0EI2XlYy-xyUG9v3K9g2kgoRpJV-1yHjA/viewform',
    editUrl: 'https://docs.google.com/forms/d/1saU6BYhcFnEqk7m91jmbUOllQ-sbw9peXPvwZ_6cGtM/edit',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1pBA8m8nNKddAPY1Tvr9ZPQcdqAJDCjZ4sLeyJSQEicg/edit#gid=517601921',
    score: '56.2% Conformidad',
  },
];

export const QUIM_DIMENSIONS: DimensionMetric[] = [
  { name: 'Eficiencia', score: 4.19, maxScore: 5, status: 'excelente', description: 'Rapidez y fluidez en completar transferencias' },
  { name: 'Efectividad', score: 4.07, maxScore: 5, status: 'excelente', description: 'Logro de objetivos transaccionales sin trabas' },
  { name: 'Aprendizaje', score: 3.65, maxScore: 5, status: 'bueno', description: 'Curva de uso ágil para usuarios primerizos' },
  { name: 'Seguridad Percibida', score: 3.55, maxScore: 5, status: 'bueno', description: 'Sensación de privacidad y custodia de fondos' },
  { name: 'Recordabilidad', score: 3.48, maxScore: 5, status: 'bueno', description: 'Facilidad de recordar flujos tras días sin uso' },
  { name: 'Manejo de Errores', score: 3.48, maxScore: 5, status: 'bueno', description: 'Mensajes legibles y recuperación operativa' },
  { name: 'Satisfacción', score: 3.38, maxScore: 5, status: 'bueno', description: 'Gusto y comodidad con el uso de la banca web' },
  { name: 'Confianza y Prevención', score: 3.10, maxScore: 5, status: 'regular', description: 'Defensas activas para evitar fallas críticas' },
  { name: 'Accesibilidad Universal', score: 2.03, maxScore: 5, status: 'critico', description: 'Contraste, fuentes y apoyo a personas con discapacidad' },
  { name: 'Flexibilidad y Personalización', score: 2.00, maxScore: 5, status: 'critico', description: 'Capacidad de ajustar vistas y atajos propios' },
];

export const SAM_DIMENSIONS = [
  { name: 'Dominancia (Control)', score: 7.75, maxScore: 9, description: 'Alta percepción de estar en control de las acciones' },
  { name: 'Valencia (Afecto Positivo)', score: 6.02, maxScore: 9, description: 'Tranquilidad y satisfacción con el servicio' },
  { name: 'Arousal (Activación Emocional)', score: 4.68, maxScore: 9, description: 'Interfaz sobria y neutral, poco estimulante' },
];

export const SUMI_SUBSCALES: DimensionMetric[] = [
  { name: 'Eficiencia y Rapidez', score: 4.07, maxScore: 5, status: 'excelente', description: 'Cumplimiento rápido de metas con pocos clics' },
  { name: 'Controlabilidad', score: 3.76, maxScore: 5, status: 'bueno', description: 'Dirección predecible y sensación de dominio' },
  { name: 'Capacidad de Aprendizaje', score: 3.66, maxScore: 5, status: 'bueno', description: 'Claridad en la terminología y menús' },
  { name: 'Afecto', score: 3.52, maxScore: 5, status: 'bueno', description: 'Disposición a seguir usando el sistema bancario' },
  { name: 'Ayuda y Asistencia', score: 2.19, maxScore: 5, status: 'critico', description: 'Carencia de documentación y soporte en pantalla' },
  { name: 'Adaptabilidad Móvil', score: 1.80, maxScore: 5, status: 'critico', description: 'Dificultades en pantallas de diferentes tamaños' },
  { name: 'Recuperación de Errores', score: 1.93, maxScore: 5, status: 'critico', description: 'Falta de reversibilidad inmediata de acciones' },
];

export const UES_SUBSCALES: DimensionMetric[] = [
  { name: 'Usabilidad Percibida (PU)', score: 3.83, maxScore: 5, status: 'bueno', description: 'Facilidad de uso sin bloqueos' },
  { name: 'Factor de Recompensa (RW)', score: 3.70, maxScore: 5, status: 'bueno', description: 'Utilidad real y recomendación a terceros' },
  { name: 'Atractivo Estético (AE)', score: 3.60, maxScore: 5, status: 'bueno', description: 'Diseño limpio pero con margen de pulido' },
  { name: 'Atención Focalizada (FA)', score: 2.39, maxScore: 5, status: 'critico', description: 'Interacción puntual y sin enganche inmersivo' },
];

export const GRIHO_SUMMARY = {
  totalQuestions: 60,
  totalResponses: 1200,
  yesPercent: 35.4,
  partialPercent: 20.8,
  notAlwaysPercent: 11.2,
  noPercent: 21.8,
  naPercent: 10.8,
};

export const CRITICAL_SURVEY_ITEMS: CriticalSurveyItem[] = [
  {
    id: 'crit-1',
    instrument: 'GRIHO',
    questionNumber: 30,
    question: '¿Se muestra un mensaje antes de tomar acciones irreversibles?',
    metric: '100% Incumplimiento (20/20 No o No siempre)',
    severity: 'Catastrófica (4)',
    impact: 'Riesgo financiero de ejecutar transferencias o borrar bolsillos por error sin confirmación.',
    recommendedAction: 'Modal destructivo / confirmación en 2 pasos con resumen de saldo.',
  },
  {
    id: 'crit-2',
    instrument: 'GRIHO',
    questionNumber: 41,
    question: '¿Existe la opción "ayuda"?',
    metric: '100% Incumplimiento (19 No, 1 No siempre)',
    severity: 'Mayor (3)',
    impact: 'El usuario no tiene guía contextual ante dudas sobre cobros, límites o tasas.',
    recommendedAction: 'Centro de Ayuda modal y botón flotante en barra de navegación.',
  },
  {
    id: 'crit-3',
    instrument: 'GRIHO',
    questionNumber: 44,
    question: '¿Dispone de un apartado de preguntas frecuentes (FAQ)?',
    metric: '100% Incumplimiento (19 No, 1 No siempre)',
    severity: 'Mayor (3)',
    impact: 'Incrementa la necesidad de soporte y abandono en solicitudes de crédito.',
    recommendedAction: 'Pestaña FAQ con buscador y acordeones de respuesta rápida.',
  },
  {
    id: 'crit-4',
    instrument: 'QUIM',
    questionNumber: 28,
    question: 'El software proporciona opciones de accesibilidad como ajuste de tamaño de texto y contraste.',
    metric: 'Media 1.73 / 5.0 (DE = 0.85)',
    severity: 'Mayor (3)',
    impact: 'Exclusión de usuarios con baja visión o dificultades visuales (violación WCAG 2.1 AA).',
    recommendedAction: 'Selector de contraste y tamaño tipográfico accesible.',
  },
  {
    id: 'crit-5',
    instrument: 'QUIM',
    questionNumber: 27,
    question: 'El software es accesible para personas con discapacidades.',
    metric: 'Media 1.80 / 5.0 (DE = 0.54)',
    severity: 'Mayor (3)',
    impact: 'Falta de compatibilidad con lectores de pantalla y navegación asistida.',
    recommendedAction: 'Auditoría ARIA, focus ring visible y roles semánticos.',
  },
  {
    id: 'crit-6',
    instrument: 'SUMI',
    questionNumber: 42,
    question: 'Puedo usar el software en diferentes dispositivos sin problemas.',
    metric: 'Media 1.80 / 5.0 (DE = 0.83)',
    severity: 'Mayor (3)',
    impact: 'Fricción y scroll forzado en pantallas de smartphones.',
    recommendedAction: 'Diseño móvil first para tablas de historial y formularios.',
  },
  {
    id: 'crit-7',
    instrument: 'GRIHO',
    questionNumber: 34,
    question: '¿Aparece un mensaje de confirmación antes de realizar las acciones?',
    metric: '95.0% Negativo (11 No, 8 No siempre)',
    severity: 'Catastrófica (4)',
    impact: 'Disparo accidental de transacciones inmediatas.',
    recommendedAction: 'Diálogo de verificación previo a emitir cualquier transferencia.',
  },
  {
    id: 'crit-8',
    instrument: 'QUIM',
    questionNumber: 22,
    question: 'El software se adapta a diferentes dispositivos sin problemas.',
    metric: 'Media 1.87 / 5.0 (DE = 0.72)',
    severity: 'Mayor (3)',
    impact: 'Tablas financieras rígidas en resoluciones reducidas.',
    recommendedAction: 'Cards responsivas y menú colapsable tipo drawer.',
  },
  {
    id: 'crit-9',
    instrument: 'SUMI',
    questionNumber: 15,
    question: 'Puedo recuperar rápidamente mi trabajo en caso de un error.',
    metric: 'Media 1.93 / 5.0 (DE = 0.77)',
    severity: 'Mayor (3)',
    impact: 'Falta de autoguardado en solicitudes largas de crédito.',
    recommendedAction: 'Persistencia local (draft saving) en formularios.',
  },
  {
    id: 'crit-10',
    instrument: 'GRIHO',
    questionNumber: 24,
    question: '¿Existen atajos de teclado para las acciones frecuentes?',
    metric: '85.0% Negativo (17 No)',
    severity: 'Media (2)',
    impact: 'Usuarios intensivos pierden velocidad operativa.',
    recommendedAction: 'Paleta de comandos rápida tipo Ctrl+K.',
  },
];

export const ACTION_BLOCKS: ActionBlock[] = [
  {
    id: 'block-a',
    title: 'Bloque A: Prevención de Errores y Modales de Confirmación',
    badge: 'Prioridad Crítica · Severidad 4',
    colorScheme: 'red',
    instrumentBacking: 'GRIHO Q30, Q34 · SUMI Q15 · QUIM Q20',
    description: 'Blindar transacciones financieras irreversibles con confirmación en dos pasos y protección contra doble clic.',
    tasks: [
      {
        id: 'task-a1',
        title: 'Modal de Confirmación con Resumen de Saldo Proyectado',
        description: 'Exigir verificación obligatoria antes de enviar transferencias mostrando titular, cuenta, monto y nuevo saldo proyectado.',
        severity: 'Catastrófica (4)',
        heuristic: 'Prevención de Errores (Nielsen #5)',
        effort: 'Bajo (1d)',
        defaultCompleted: false,
      },
      {
        id: 'task-a2',
        title: 'Diálogo Destructivo para Eliminación de Bolsillos',
        description: 'Alertar con confirmación explícita que al cerrar un bolsillo sus fondos retornan automáticamente a la cuenta principal.',
        severity: 'Catastrófica (4)',
        heuristic: 'Control y Libertad (Nielsen #3)',
        effort: 'Bajo (1d)',
        defaultCompleted: false,
      },
      {
        id: 'task-a3',
        title: 'Protección Preventiva de Doble Clic en Envíos',
        description: 'Deshabilitar de inmediato el botón de acción tras el primer clic mostrando spinner y evitando solicitudes duplicadas.',
        severity: 'Catastrófica (4)',
        heuristic: 'Prevención de Errores (Nielsen #5)',
        effort: 'Bajo (1d)',
        defaultCompleted: true,
      },
      {
        id: 'task-a4',
        title: 'Toast de Notificación con Opción "Deshacer" (Undo)',
        description: 'Dar ventana de 5 segundos para deshacer transferencias entre bolsillos propios o cancelaciones reversibles.',
        severity: 'Media (2)',
        heuristic: 'Control y Libertad (Nielsen #3)',
        effort: 'Medio (2-3d)',
        defaultCompleted: false,
      },
    ],
  },
  {
    id: 'block-b',
    title: 'Bloque B: Centro de Ayuda Integrado, FAQ y Onboarding',
    badge: 'Prioridad Alta · Severidad 3',
    colorScheme: 'amber',
    instrumentBacking: 'GRIHO Q41, Q44, Q45 · SUMI Q36',
    description: 'Proveer asistencia contextual inmediata para reducir curva de aprendizaje y dudas operativas.',
    tasks: [
      {
        id: 'task-b1',
        title: 'Drawer / Modal Flotante de Centro de Ayuda',
        description: 'Acceso directo desde la barra superior con buscador de artículos de soporte bancario.',
        severity: 'Mayor (3)',
        heuristic: 'Ayuda y Documentación (Nielsen #10)',
        effort: 'Medio (2-3d)',
        defaultCompleted: false,
      },
      {
        id: 'task-b2',
        title: 'Catálogo de Preguntas Frecuentes (FAQ) Interactivo',
        description: 'Acordeón con respuestas claras sobre topes de transferencia, liquidación de crédito y seguridad.',
        severity: 'Mayor (3)',
        heuristic: 'Ayuda y Documentación (Nielsen #10)',
        effort: 'Bajo (1d)',
        defaultCompleted: false,
      },
      {
        id: 'task-b3',
        title: 'Tooltips Explicativos de Términos Financieros',
        description: 'Iconos (?) junto a Tasa E.A., Amortización Francesa y Cuota Fija para explicar conceptos bancarios.',
        severity: 'Media (2)',
        heuristic: 'Correspondencia con Mundo Real (Nielsen #2)',
        effort: 'Bajo (1d)',
        defaultCompleted: true,
      },
      {
        id: 'task-b4',
        title: 'Tour Guiado (Onboarding) de 4 Pasos',
        description: 'Guía visual para usuarios nuevos resaltando Cuentas, Transferencias, Bolsillos y Préstamos.',
        severity: 'Media (2)',
        heuristic: 'Capacidad de Aprendizaje (QUIM)',
        effort: 'Medio (2-3d)',
        defaultCompleted: false,
      },
    ],
  },
  {
    id: 'block-c',
    title: 'Bloque C: Accesibilidad Universal WCAG 2.1 AA',
    badge: 'Prioridad Alta · Severidad 3',
    colorScheme: 'blue',
    instrumentBacking: 'QUIM Q27, Q28, Q29 · GRIHO Q51',
    description: 'Garantizar que la banca digital sea operable por cualquier persona, incluyendo baja visión y lectores de pantalla.',
    tasks: [
      {
        id: 'task-c1',
        title: 'Auditoría de Contraste Cromático Mínimo 4.5:1',
        description: 'Corregir tonos grises en textos secundarios y botones deshabilitados para cumplir WCAG AA.',
        severity: 'Mayor (3)',
        heuristic: 'Accesibilidad (WCAG 2.1)',
        effort: 'Bajo (1d)',
        defaultCompleted: false,
      },
      {
        id: 'task-c2',
        title: 'Etiquetas aria-label y Roles Semánticos en Botones',
        description: 'Nombrar accesoriamente cada botón de icono (notificaciones, logout, visibilidad de saldo).',
        severity: 'Mayor (3)',
        heuristic: 'Accesibilidad (WCAG 2.1)',
        effort: 'Medio (2-3d)',
        defaultCompleted: false,
      },
      {
        id: 'task-c3',
        title: 'Selector de Tamaño de Fuente Accesible (A- / A+)',
        description: 'Permitir al usuario escalar la tipografía de 14px a 18px sin romper las cajas de diseño.',
        severity: 'Media (2)',
        heuristic: 'Flexibilidad (QUIM)',
        effort: 'Bajo (1d)',
        defaultCompleted: false,
      },
      {
        id: 'task-c4',
        title: 'Navegación 100% por Teclado con Anillo de Foco Visible',
        description: 'Garantizar foco secuencial vía Tab y contorno nítido (focus-visible:ring-2) en todo elemento interactivo.',
        severity: 'Mayor (3)',
        heuristic: 'Accesibilidad (WCAG 2.1)',
        effort: 'Bajo (1d)',
        defaultCompleted: false,
      },
    ],
  },
  {
    id: 'block-d',
    title: 'Bloque D: Optimización Responsiva y Usabilidad Móvil',
    badge: 'Prioridad Alta · Severidad 3',
    colorScheme: 'purple',
    instrumentBacking: 'QUIM Q22 · SUMI Q42 · GRIHO Q27',
    description: 'Eliminar desbordes horizontales y adaptar el panel a teléfonos inteligentes y tablets.',
    tasks: [
      {
        id: 'task-d1',
        title: 'Menú Lateral Colapsable / Bottom Navigation en Móviles',
        description: 'Sustituir el menú superior por barra inferior fija o drawer accesible con el pulgar en pantallas < 768px.',
        severity: 'Mayor (3)',
        heuristic: 'Diseño Responsivo',
        effort: 'Medio (2-3d)',
        defaultCompleted: false,
      },
      {
        id: 'task-d2',
        title: 'Conversión de Tablas Financieras a Formato Tarjetas (Cards)',
        description: 'Mostrar movimientos bancarios en tarjetas apiladas con datos esenciales en lugar de tabla ancha con scroll.',
        severity: 'Mayor (3)',
        heuristic: 'Reconocimiento sobre Recuerdo (Nielsen #6)',
        effort: 'Bajo (1d)',
        defaultCompleted: false,
      },
      {
        id: 'task-d3',
        title: 'Área Táctil Mínima de 48x48 px (Apple/Material Guidelines)',
        description: 'Aumentar padding en botones de acción y selectores de fecha en interfaces táctiles.',
        severity: 'Media (2)',
        heuristic: 'Eficiencia Táctil',
        effort: 'Bajo (1d)',
        defaultCompleted: true,
      },
      {
        id: 'task-d4',
        title: 'Activación de Teclado Numérico Automático (inputMode="decimal")',
        description: 'Configurar campos de monto para abrir el teclado de dígitos financieros en iOS y Android.',
        severity: 'Media (2)',
        heuristic: 'Flexibilidad y Eficiencia (Nielsen #7)',
        effort: 'Bajo (1d)',
        defaultCompleted: true,
      },
    ],
  },
  {
    id: 'block-e',
    title: 'Bloque E: Personalización, Atajos de Teclado y Persistencia',
    badge: 'Prioridad Media · Severidad 2',
    colorScheme: 'emerald',
    instrumentBacking: 'QUIM Q21 · SUMI Q44 · GRIHO Q24, Q46, Q47, Q55',
    description: 'Empoderar a usuarios intensivos con personalización visual y productividad mediante teclado.',
    tasks: [
      {
        id: 'task-e1',
        title: 'Modo Oscuro / Claro Persistente (Dark Mode)',
        description: 'Toggle de tema sincronizado con preferencia de sistema operativo y almacenamiento en localStorage.',
        severity: 'Media (2)',
        heuristic: 'Personalización de Espacio (GRIHO Q55)',
        effort: 'Bajo (1d)',
        defaultCompleted: false,
      },
      {
        id: 'task-e2',
        title: 'Paleta de Comandos Rápida (Ctrl+K / Cmd+K)',
        description: 'Buscador global flotante para saltar a cualquier cuenta, bolsillo o crédito con pulsaciones de teclas.',
        severity: 'Media (2)',
        heuristic: 'Atajos de Teclado (Nielsen #7)',
        effort: 'Medio (2-3d)',
        defaultCompleted: false,
      },
      {
        id: 'task-e3',
        title: 'Autoguardado de Borradores en Solicitud de Préstamos',
        description: 'Guardar datos en progreso en almacenamiento local para no perder avance si la página se recarga.',
        severity: 'Mayor (3)',
        heuristic: 'Prevención de Errores y Autoguardado (GRIHO Q47)',
        effort: 'Bajo (1d)',
        defaultCompleted: false,
      },
      {
        id: 'task-e4',
        title: 'Reordenamiento y Categorización Visual de Bolsillos',
        description: 'Permitir ordenar bolsillos de ahorro por fecha de meta o saldo acumulado.',
        severity: 'Media (2)',
        heuristic: 'Flexibilidad (QUIM Q21)',
        effort: 'Bajo (1d)',
        defaultCompleted: false,
      },
    ],
  },
  {
    id: 'block-f',
    title: 'Bloque F: Diseño Emocional, Feedback Visual y Micro-interacciones',
    badge: 'Prioridad Deseable · Severidad 1-2',
    colorScheme: 'indigo',
    instrumentBacking: 'SAM Arousal · UES FA/AE · GRIHO Q60',
    description: 'Elevar el valor percibido con retroalimentación sensorial satisfactoria y comprobantes visuales.',
    tasks: [
      {
        id: 'task-f1',
        title: 'Pantalla de Éxito Enriquecida con Micro-animación SVG',
        description: 'Animación sutil de verificación (check verde elástico) tras culminar una transferencia con éxito.',
        severity: 'Media (2)',
        heuristic: 'Estado del Sistema (Nielsen #1)',
        effort: 'Bajo (1d)',
        defaultCompleted: false,
      },
      {
        id: 'task-f2',
        title: 'Descarga de Comprobante Digital (Voucher Bancario)',
        description: 'Generar comprobante editorial limpio imprimible o descargable con referencia y código QR.',
        severity: 'Media (2)',
        heuristic: 'Factor de Recompensa (UES)',
        effort: 'Bajo (1d)',
        defaultCompleted: false,
      },
      {
        id: 'task-f3',
        title: 'Skeleton Loaders Suaves para Eliminar Saltos de Contenido',
        description: 'Reemplazar textos de "Cargando..." por siluetas animadas que respeten la geometría de las tarjetas.',
        severity: 'Cosmética (1)',
        heuristic: 'Estética Minimalista (Nielsen #8)',
        effort: 'Bajo (1d)',
        defaultCompleted: true,
      },
      {
        id: 'task-f4',
        title: 'Celebración Visual al Alcanzar Metas de Ahorro en Bolsillos',
        description: 'Efecto confeti sutil cuando el monto ahorrado en un bolsillo alcanza el 100% de la meta planeada.',
        severity: 'Cosmética (1)',
        heuristic: 'Diseño Emocional (SAM Arousal)',
        effort: 'Bajo (1d)',
        defaultCompleted: false,
      },
    ],
  },
];
