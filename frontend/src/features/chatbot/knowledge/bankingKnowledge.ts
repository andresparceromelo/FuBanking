import { ChatMessage, QuickChip } from '../types/chatbot.types';

export const GABRIELILLO_INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'intro-1',
    sender: 'gabrielillo',
    text: '¡Hola! Soy Gabrielillo, tu asistente bancario inteligente en FuBanking. ¿En qué te puedo asesorar hoy?',
    timestamp: 'Ahora',
  },
];

export const GABRIELILLO_QUICK_CHIPS: QuickChip[] = [
  {
    id: 'chip-loans',
    label: '💰 Requisitos de Crédito',
    prompt: '¿Cuáles son los requisitos y montos para solicitar un crédito?',
  },
  {
    id: 'chip-pockets',
    label: '👛 ¿Cómo funcionan los Bolsillos?',
    prompt: '¿Cómo funcionan los bolsillos y cuánto cuesta transferir?',
  },
  {
    id: 'chip-cards',
    label: '💳 Seguridad de Tarjetas',
    prompt: '¿Cómo puedo bloquear o proteger mi tarjeta virtual?',
  },
  {
    id: 'chip-2fa',
    label: '🔒 Política de 2FA',
    prompt: '¿Por qué el código 2FA solo tiene 1 intento de seguridad?',
  },
];

interface KnowledgeEntry {
  keywords: string[];
  response: string;
  actionLink?: {
    label: string;
    href: string;
  };
}

export const BANKING_KNOWLEDGE: KnowledgeEntry[] = [
  {
    keywords: ['2fa', 'dos factores', 'otp', 'intento', 'seguridad', 'codigo', 'correo', 'verificacion', 'autenticacion'],
    response:
      'Por normativas de alta seguridad bancaria, el código OTP enviado a tu correo cuenta con política de 1 solo intento. Si ingresas un código erróneo, este queda inmediatamente anulado para prevenir ataques de fuerza bruta o suplantación, debiendo reiniciar el proceso de login.',
    actionLink: {
      label: 'Ver mi Perfil y Seguridad',
      href: '/profile',
    },
  },
  {
    keywords: ['credito', 'prestamo', 'monto', 'simular', 'tasa', 'requisito', 'cuota', 'sfc', 'limite'],
    response:
      'En FuBanking puedes solicitar créditos de libre inversión regulados por la Superintendencia Financiera de Colombia (SFC). Montos permitidos: entre $500.000 y $30.000.000 COP, plazos de 3 a 60 cuotas mensuales, y tasa preferencial del 18% E.A. Requisitos: ser mayor de edad (+18), tener documento verificado en perfil e ingresos mensuales registrados.',
    actionLink: {
      label: 'Ir a Créditos y Simular',
      href: '/loans',
    },
  },
  {
    keywords: ['bolsillo', 'bolsillos', 'ahorro', 'meta', 'pocket', 'guardar'],
    response:
      'Los Bolsillos te permiten apartar dinero de tu cuenta principal para metas específicas de ahorro. Puedes transferir dinero entre tu cuenta y tus bolsillos al instante, 100% libre de costo, sin cuotas de manejo ni cobros ocultos.',
    actionLink: {
      label: 'Explorar mis Bolsillos',
      href: '/pockets',
    },
  },
  {
    keywords: ['tarjeta', 'virtual', 'bloquear', 'congelar', 'cvv', 'card', 'tarjetas', 'debito'],
    response:
      'Tus tarjetas virtuales en FuBanking cuentan con protección antifraude en tiempo real. Puedes activar o congelar tu tarjeta con un solo clic si detectas algún movimiento sospechoso, además de consultar los detalles sensibles de manera segura.',
    actionLink: {
      label: 'Gestionar mis Tarjetas',
      href: '/cards',
    },
  },
  {
    keywords: ['transferir', 'transferencia', 'dinero', 'enviar', 'solicitar', 'cobrar', 'cuenta'],
    response:
      'Puedes realizar transferencias instantáneas entre cuentas de FuBanking utilizando el correo electrónico del destinatario o su número de cuenta. También puedes emitir solicitudes de cobro inmediatas desde el panel de solicitudes.',
    actionLink: {
      label: 'Ir a Transferencias',
      href: '/transfers',
    },
  },
  {
    keywords: ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'saludos', 'hey'],
    response:
      '¡Hola! Qué gusto saludarte. Soy Gabrielillo y estoy listo para ayudarte con tus créditos, bolsillos de ahorro, tarjetas virtuales, transferencias o dudas de seguridad. ¿Qué te gustaría consultar hoy?',
  },
  {
    keywords: ['gracias', 'muchas gracias', 'adios', 'chao', 'hasta luego', 'vale'],
    response:
      '¡Con todo el gusto! En FuBanking estamos siempre disponibles para cuidar tu salud financiera. Recuerda que puedes escribirme cuando lo necesites.',
  },
];

/**
 * Busca la mejor respuesta en la base de conocimiento según el mensaje del usuario.
 */
export function matchGabrielilloResponse(input: string): {
  text: string;
  actionLink?: { label: string; href: string };
} {
  const normalized = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const entry of BANKING_KNOWLEDGE) {
    const hasMatch = entry.keywords.some((kw) =>
      normalized.includes(
        kw
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''),
      ),
    );
    if (hasMatch) {
      return {
        text: entry.response,
        actionLink: entry.actionLink,
      };
    }
  }

  return {
    text: 'Entiendo tu consulta. Como asesor financiero de FuBanking, puedo orientarte sobre Créditos (montos y simulación), Bolsillos de ahorro, Tarjetas virtuales, Transferencias y Seguridad 2FA. ¿Podrías darme más detalle o seleccionar una de las opciones sugeridas?',
  };
}
