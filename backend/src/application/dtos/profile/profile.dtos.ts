/**
 * DTOs del módulo de Perfil.
 */

// ── Ver Perfil ────────────────────────────────────────────────────────────

export interface GetProfileResponseDto {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  secondLastName: string | null;
  fullName: string;
  birthDate: string;
  email: string;
  document: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

// ── Actualizar Perfil ─────────────────────────────────────────────────────

export interface UpdateProfileDto {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  secondLastName?: string | null;
  birthDate?: Date;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateProfileResponseDto extends GetProfileResponseDto {}
