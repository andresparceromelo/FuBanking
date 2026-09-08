import React from 'react';
import { render, screen } from '@testing-library/react';
import { RegisterForm } from '../../features/auth/components/RegisterForm';
import { AuthProvider } from '../../shared/hooks/useAuth';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '',
}));

describe('RegisterForm', () => {
  it('renders correctly', () => {
    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );
    expect(screen.getByLabelText(/Primer nombre/i)).toBeDefined();
    expect(screen.getByLabelText(/Correo electrónico/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Abrir cuenta/i })).toBeDefined();
  });
});
