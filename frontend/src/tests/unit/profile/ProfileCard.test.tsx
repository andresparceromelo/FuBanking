import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileCard } from '@/features/profile/components/ProfileCard';
import { profileService } from '@/features/profile/services/profile.service';
import { authService } from '@/features/auth/services/auth.service';
import type { PublicUser } from '@/features/auth/types/auth.types';

const { mockUpdateUser, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockUpdateUser: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('@/features/profile/services/profile.service', () => ({
  profileService: { uploadDocument: vi.fn() },
}));

vi.mock('@/features/auth/services/auth.service', () => ({
  authService: { enableTwoFactor: vi.fn(), disableTwoFactor: vi.fn() },
}));

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({ updateUser: mockUpdateUser }),
}));

vi.mock('@/shared/components/feedback/ToastProvider', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError, warning: vi.fn() }),
}));

const uploadDocument = profileService.uploadDocument as unknown as ReturnType<typeof vi.fn>;
const enableTwoFactor = authService.enableTwoFactor as unknown as ReturnType<typeof vi.fn>;
const disableTwoFactor = authService.disableTwoFactor as unknown as ReturnType<typeof vi.fn>;

function user(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: 'u1', email: 'ana@example.com', document: '1234567890',
    firstName: 'Ana', middleName: null, lastName: 'Garcia', secondLastName: null,
    fullName: 'Ana Garcia', birthDate: '1995-06-15', phone: '+573001234567',
    avatarUrl: null, monthlyIncome: 1800000, documentVerified: false,
    documentVerifiedAt: null, isActive: true, twoFactorEnabled: false,
    role: 'user', createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('ProfileCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render user info with fallbacks', () => {
    render(<ProfileCard user={user({ phone: null, monthlyIncome: null, birthDate: '' })} onEditClick={() => {}} />);

    expect(screen.getByText('Ana Garcia')).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('No registrado').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('No registrada')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('should render avatar image when present', () => {
    render(<ProfileCard user={user({ avatarUrl: 'https://x.com/a.png' })} onEditClick={() => {}} />);

    expect(screen.getByAltText('Ana Garcia')).toBeInTheDocument();
  });

  it('should render the verified identity section', () => {
    render(<ProfileCard user={user({ documentVerified: true })} onEditClick={() => {}} />);

    expect(screen.getByText('Tu documento fue verificado. Ya puedes solicitar un crédito.')).toBeInTheDocument();
    expect(screen.getByText('Reemplazar PDF')).toBeInTheDocument();
  });

  it('should ignore empty file selection', async () => {
    render(<ProfileCard user={user()} onEditClick={() => {}} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });

    await new Promise((r) => setTimeout(r, 100));
    expect(uploadDocument).not.toHaveBeenCalled();
  });

  it('should upload without a toggle callback', async () => {
    uploadDocument.mockResolvedValue(user({ documentVerified: true }));
    render(<ProfileCard user={user()} onEditClick={() => {}} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['%PDF'], 'a.pdf', { type: 'application/pdf' })] } });

    await waitFor(() => expect(uploadDocument).toHaveBeenCalled());
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it('should call onEditClick', () => {
    const onEditClick = vi.fn();
    render(<ProfileCard user={user()} onEditClick={onEditClick} />);

    fireEvent.click(screen.getAllByText('Editar datos')[0]);
    expect(onEditClick).toHaveBeenCalled();
  });

  it('should reject non-pdf uploads', async () => {
    render(<ProfileCard user={user()} onEditClick={() => {}} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'foto.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Archivo inválido', expect.any(String)),
    );
    expect(uploadDocument).not.toHaveBeenCalled();
  });

  it('should upload a pdf and notify', async () => {
    const updated = user({ documentVerified: true });
    uploadDocument.mockResolvedValue(updated);
    const onToggleSuccess = vi.fn();
    render(<ProfileCard user={user()} onEditClick={() => {}} onToggleSuccess={onToggleSuccess} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['%PDF'], 'cedula.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(uploadDocument).toHaveBeenCalledWith(file));
    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith(updated));
    expect(mockToastSuccess).toHaveBeenCalledWith('Documento verificado', expect.any(String));
    expect(onToggleSuccess).toHaveBeenCalled();
  });

  it('should fall back on non-object upload errors', async () => {
    uploadDocument.mockRejectedValue('boom');
    render(<ProfileCard user={user()} onEditClick={() => {}} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['%PDF'], 'a.pdf', { type: 'application/pdf' })] } });

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        'No pudimos verificar el documento',
        'No pudimos subir tu documento. Intenta de nuevo.',
      ),
    );
  });

  it('should toast with fallback on empty upload error', async () => {
    uploadDocument.mockRejectedValue({});
    render(<ProfileCard user={user()} onEditClick={() => {}} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['%PDF'], 'a.pdf', { type: 'application/pdf' })] } });

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        'No pudimos verificar el documento',
        'No pudimos subir tu documento. Intenta de nuevo.',
      ),
    );
  });

  it('should toast with fallback on 2FA failure without message', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      enableTwoFactor.mockRejectedValue(null);
      render(<ProfileCard user={user()} onEditClick={() => {}} />);

      fireEvent.click(screen.getByText('Activar 2FA'));

      await waitFor(() =>
        expect(mockToastError).toHaveBeenCalledWith(
          'No pudimos actualizar 2FA',
          'Hubo un error al actualizar la autenticacion de dos factores.',
        ),
      );
    } finally {
      err.mockRestore();
    }
  });

  it('should toast with fallback on upload failure', async () => {
    uploadDocument.mockRejectedValue(null);
    render(<ProfileCard user={user()} onEditClick={() => {}} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['%PDF'], 'a.pdf', { type: 'application/pdf' })] } });

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        'No pudimos verificar el documento',
        'No pudimos subir tu documento. Intenta de nuevo.',
      ),
    );
  });

  it('should open the file picker on upload click', () => {
    render(<ProfileCard user={user()} onEditClick={() => {}} />);

    fireEvent.click(screen.getByText('Subir PDF'));

    expect(uploadDocument).not.toHaveBeenCalled();
  });

  it('should enable 2FA', async () => {
    enableTwoFactor.mockResolvedValue(undefined);
    const onToggleSuccess = vi.fn();
    render(<ProfileCard user={user()} onEditClick={() => {}} onToggleSuccess={onToggleSuccess} />);

    fireEvent.click(screen.getByText('Activar 2FA'));

    await waitFor(() => expect(enableTwoFactor).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({ twoFactorEnabled: true })),
    );
    expect(onToggleSuccess).toHaveBeenCalled();
  });

  it('should disable 2FA', async () => {
    disableTwoFactor.mockResolvedValue(undefined);
    render(
      <ProfileCard user={user({ twoFactorEnabled: true })} onEditClick={() => {}} />,
    );

    fireEvent.click(screen.getByText('Desactivar 2FA'));

    await waitFor(() => expect(disableTwoFactor).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith('2FA desactivado', expect.any(String)),
    );
  });

  it('should toast on 2FA failure', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      enableTwoFactor.mockRejectedValue({ message: 'caído' });
      render(<ProfileCard user={user()} onEditClick={() => {}} />);

      fireEvent.click(screen.getByText('Activar 2FA'));

      await waitFor(() =>
        expect(mockToastError).toHaveBeenCalledWith('No pudimos actualizar 2FA', 'caído'),
      );
    } finally {
      err.mockRestore();
    }
  });
});
