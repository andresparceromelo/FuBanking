'use client';

import React from 'react';
import { PASSWORD_MIN_LENGTH } from '../schemas/auth.schemas';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Niveles de fortaleza de contraseña. */
export type PasswordStrength = 'empty' | 'weak' | 'medium' | 'strong';

// ─── Lógica de evaluación ─────────────────────────────────────────────────────

/** Criterios de complejidad evaluados individualmente. */
export interface PasswordCriteria {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

/**
 * Evalúa los criterios de complejidad de una contraseña.
 * Exportada para facilitar pruebas unitarias.
 */
export function evaluatePasswordCriteria(password: string): PasswordCriteria {
  return {
    hasMinLength: password.length >= PASSWORD_MIN_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^a-zA-Z0-9]/.test(password),
  };
}

/**
 * Calcula el nivel de fortaleza basado en los criterios evaluados.
 *
 * - **Débil**: no cumple todos los requisitos mínimos (longitud, mayúscula, minúscula, número).
 * - **Media**: cumple los mínimos obligatorios pero sin símbolo especial.
 * - **Fuerte**: cumple todos los criterios incluyendo símbolo especial.
 */
export function calculateStrength(criteria: PasswordCriteria): PasswordStrength {
  const { hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSymbol } = criteria;
  const meetsMinimums = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  if (!meetsMinimums) return 'weak';
  if (meetsMinimums && !hasSymbol) return 'medium';
  return 'strong';
}

// ─── Configuración visual ─────────────────────────────────────────────────────

const STRENGTH_CONFIG: Record<
  Exclude<PasswordStrength, 'empty'>,
  { label: string; filledBars: number; barColor: string; textColor: string }
> = {
  weak: {
    label: 'Débil',
    filledBars: 1,
    barColor: 'bg-red-500',
    textColor: 'text-red-500',
  },
  medium: {
    label: 'Media',
    filledBars: 2,
    barColor: 'bg-yellow-400',
    textColor: 'text-yellow-500',
  },
  strong: {
    label: 'Fuerte',
    filledBars: 3,
    barColor: 'bg-green-500',
    textColor: 'text-green-600',
  },
};

// ─── Componente ───────────────────────────────────────────────────────────────

export interface PasswordStrengthMeterProps {
  /** Valor actual del campo de contraseña. */
  password: string;
}

/**
 * Indicador visual de fortaleza de contraseña.
 *
 * Muestra una barra de tres segmentos con código de colores y mensajes
 * específicos sobre los criterios aún no cumplidos.
 * Se renderiza vacío si la contraseña está en blanco.
 */
export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const criteria = evaluatePasswordCriteria(password);
  const strength = calculateStrength(criteria);
  const config = STRENGTH_CONFIG[strength];

  const missingItems: string[] = [];
  if (!criteria.hasMinLength) missingItems.push(`al menos ${PASSWORD_MIN_LENGTH} caracteres`);
  if (!criteria.hasUppercase) missingItems.push('una letra mayúscula');
  if (!criteria.hasLowercase) missingItems.push('una letra minúscula');
  if (!criteria.hasNumber) missingItems.push('un número');
  if (!criteria.hasSymbol) missingItems.push('un símbolo especial (!@#$...)');

  return (
    <div
      className="mt-2 space-y-1.5"
      role="status"
      aria-label={`Fortaleza de contraseña: ${config.label}`}
      aria-live="polite"
    >
      {/* Barra de tres segmentos */}
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={[
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              bar <= config.filledBars ? config.barColor : 'bg-muted',
            ].join(' ')}
          />
        ))}
      </div>

      {/* Etiqueta de fortaleza */}
      <p className={`text-xs font-medium ${config.textColor}`}>
        Contraseña {config.label}
      </p>

      {/* Criterios pendientes */}
      {missingItems.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Falta: {missingItems.join(', ')}.
        </p>
      )}
    </div>
  );
}
