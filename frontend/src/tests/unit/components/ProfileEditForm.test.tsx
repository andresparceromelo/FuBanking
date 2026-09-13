import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileEditForm } from '@/features/profile/components/ProfileEditForm';
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile';
import type { PublicUser } from '@/features/auth/types/auth.types';

const { mockHandleUpdate, formState } = vi.hoisted(() => ({
  mockHandleUpdate: vi.fn(),
  formState: { isLoading: false, error: null as null | { message?: string } },
}));

vi.mock('@/features/profile/hooks/useUpdateProfile', () => ({
  useUpdateProfile: () => ({
    handleUpdate: mockHandleUpdate,
    isLoading: formState.isLoading,
    error: formState.error,
  }),
}));

const mockHandleUpdateTyped = mockHandleUpdate as unknown as ReturnType<typeof vi.fn>;

function user(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: 'u1', email: 'ana@example.com', document: '1234567890',
    firstName: 'Ana', middleName: null, lastName: 'Garcia', secondLastName: null,
    fullName: 'Ana Garcia', birthDate: '1995-06-15', phone: null,
    avatarUrl: null, monthlyIncome: 1800000, documentVerified: false,
    documentVerifiedAt: null, isActive: true, twoFactorEnabled: false,
    role: 'user', createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('ProfileEditForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    formState.isLoading = false;
    formState.error = null;
  });

  it('should show the server error banner', () => {
    formState.error = { message: 'Error del servidor' };
    render(<ProfileEditForm user={user()} onCancel={() => {}} onSuccess={() => {}} />);

    expect(screen.getByText('Error del servidor')).toBeInTheDocument();
  });

  it('should render defaults and call onCancel', () => {
    const onCancel = vi.fn();
    render(<ProfileEditForm user={user()} onCancel={onCancel} onSuccess={() => {}} />);

    expect(screen.getByDisplayValue('Ana')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ana@example.com')).toBeDisabled();

    fireEvent.click(screen.getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('should submit only the changed fields', async () => {
    render(<ProfileEditForm user={user()} onCancel={() => {}} onSuccess={() => {}} />);

    fireEvent.change(screen.getByLabelText('Primer nombre'), { target: { value: 'Maria' } });
    await waitFor(() => expect(screen.getByDisplayValue('Maria')).toBeInTheDocument());
    fireEvent.submit(screen.getByText('Guardar cambios').closest('form')!);

    await waitFor(() => expect(mockHandleUpdateTyped).toHaveBeenCalled());
    expect(mockHandleUpdateTyped.mock.calls[0][0]).toEqual({ firstName: 'Maria' });
  });

  it('should submit all changed fields', async () => {
    render(<ProfileEditForm user={user()} onCancel={() => {}} onSuccess={() => {}} />);

    fireEvent.change(screen.getByLabelText('Segundo nombre'), { target: { value: 'Luis' } });
    fireEvent.change(screen.getByLabelText('Primer apellido'), { target: { value: 'Perez' } });
    fireEvent.change(screen.getByLabelText('Segundo apellido'), { target: { value: 'Gomez' } });
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '1990-01-02' } });
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '+573009998877' } });
    fireEvent.submit(screen.getByText('Guardar cambios').closest('form')!);

    await waitFor(() => expect(mockHandleUpdateTyped).toHaveBeenCalled());
    expect(mockHandleUpdateTyped.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        middleName: 'Luis',
        lastName: 'Perez',
        secondLastName: 'Gomez',
        birthDate: '1990-01-02',
        phone: '+573009998877',
      }),
    );
  });

  it('should submit changed income', async () => {
    render(<ProfileEditForm user={user()} onCancel={() => {}} onSuccess={() => {}} />);

    fireEvent.change(screen.getByLabelText('Ingreso mensual'), { target: { value: '2500000' } });
    fireEvent.submit(screen.getByText('Guardar cambios').closest('form')!);

    await waitFor(() => expect(mockHandleUpdateTyped).toHaveBeenCalled());
    expect(mockHandleUpdateTyped.mock.calls[0][0]).toEqual({ monthlyIncome: 2500000 });
  });

  it('should submit a changed birthDate', async () => {
    render(<ProfileEditForm user={user()} onCancel={() => {}} onSuccess={() => {}} />);

    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '1990-01-02' } });
    fireEvent.submit(screen.getByText('Guardar cambios').closest('form')!);

    await waitFor(() => expect(mockHandleUpdateTyped).toHaveBeenCalled());
    expect(mockHandleUpdateTyped.mock.calls[0][0]).toEqual(
      expect.objectContaining({ birthDate: '1990-01-02' }),
    );
  });

  it('should render defaults for a user without birthDate or income', () => {
    render(
      <ProfileEditForm
        user={user({ birthDate: '', monthlyIncome: null })}
        onCancel={() => {}}
        onSuccess={() => {}}
      />,
    );

    expect(screen.getByLabelText('Fecha de nacimiento')).toHaveDisplayValue('');
    fireEvent.submit(screen.getByText('Guardar cambios').closest('form')!);
  });

  it('should cancel when a birthless user submits unchanged', async () => {
    const onCancel = vi.fn();
    render(
      <ProfileEditForm
        user={user({ birthDate: '' })}
        onCancel={onCancel}
        onSuccess={() => {}}
      />,
    );

    fireEvent.submit(screen.getByText('Guardar cambios').closest('form')!);

    await waitFor(() => expect(onCancel).toHaveBeenCalled());
    expect(mockHandleUpdateTyped).not.toHaveBeenCalled();
  });

  it('should submit with all optional fields set', async () => {
    render(
      <ProfileEditForm
        user={user({
          middleName: 'Luis',
          secondLastName: 'Gomez',
          phone: '+573009998877',
          avatarUrl: 'https://x.com/a.png',
        })}
        onCancel={() => {}}
        onSuccess={() => {}}
      />,
    );

    fireEvent.change(screen.getByLabelText('Primer nombre'), { target: { value: 'Maria' } });
    fireEvent.submit(screen.getByText('Guardar cambios').closest('form')!);

    await waitFor(() => expect(mockHandleUpdateTyped).toHaveBeenCalled());
    expect(mockHandleUpdateTyped.mock.calls[0][0]).toEqual({ firstName: 'Maria' });
  });

  it('should clear optional fields back to null', async () => {
    render(
      <ProfileEditForm
        user={user({
          middleName: 'Luis',
          secondLastName: 'Gomez',
          birthDate: '1995-06-15',
          phone: '+573009998877',
          avatarUrl: 'https://x.com/a.png',
          monthlyIncome: 1800000,
        })}
        onCancel={() => {}}
        onSuccess={() => {}}
      />,
    );

    fireEvent.change(screen.getByLabelText('Segundo nombre'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Segundo apellido'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '' } });
    fireEvent.submit(screen.getByText('Guardar cambios').closest('form')!);

    await waitFor(() => expect(mockHandleUpdateTyped).toHaveBeenCalled());
    expect(mockHandleUpdateTyped.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        middleName: null,
        secondLastName: null,
        birthDate: null,
        phone: null,
      }),
    );
  });

  it('should call onCancel when nothing changed', async () => {
    const onCancel = vi.fn();
    render(<ProfileEditForm user={user()} onCancel={onCancel} onSuccess={() => {}} />);

    fireEvent.submit(screen.getByText('Guardar cambios').closest('form')!);

    await waitFor(() => expect(onCancel).toHaveBeenCalled());
    expect(mockHandleUpdateTyped).not.toHaveBeenCalled();
  });
});
