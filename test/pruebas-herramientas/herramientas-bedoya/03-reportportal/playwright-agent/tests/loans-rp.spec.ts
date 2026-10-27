import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

function getJwtSecret(): string {
  try {
    const envPath = path.resolve('backend/.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/JWT_SECRET\s*=\s*([^\r\n]+)/);
      if (match?.[1]) return match[1].trim();
    }
  } catch {}
  return 'super-secret-jwt-key-for-development-32-chars-min';
}

function generateAuthToken() {
  const secret = getJwtSecret();
  const user = {
    id: 'u-client-gabriel-001',
    email: 'bedoyacanoandres2@gmail.com',
    role: 'client' as const,
    fullName: 'Gabriel Cliente'
  };

  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: '2h' }
  );

  const userPayload = {
    id: user.id,
    email: user.email,
    firstName: 'Gabriel',
    middleName: null,
    lastName: 'Cliente',
    secondLastName: null,
    fullName: user.fullName,
    document: '1020304050',
    documentVerified: true,
    documentVerifiedAt: new Date().toISOString(),
    birthDate: '1995-05-15',
    phone: '3001234567',
    avatarUrl: null,
    monthlyIncome: 4500000,
    isActive: true,
    twoFactorEnabled: false,
    role: user.role,
    createdAt: new Date().toISOString(),
    requiresTwoFactor: false
  };

  return { token, userPayload };
}

test.describe('Herramienta 3 - ReportPortal: Suite Independiente Playwright Créditos', () => {
  test.beforeEach(async ({ context }) => {
    const { token, userPayload } = generateAuthToken();

    // Inyectar cookie de autenticación
    await context.addCookies([
      {
        name: 'token',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    // Inyectar localStorage
    await context.addInitScript(
      ({ t, u }) => {
        try {
          window.localStorage.setItem('token', t);
          window.localStorage.setItem('user', JSON.stringify(u));
        } catch {}
      },
      { t: token, u: userPayload }
    );
  });

  test('simula un crédito de 5 millones de pesos a 12 meses en Playwright', async ({ page }) => {
    await page.goto('/loans');
    await expect(page.locator('[data-cy="loan-amount"]')).toBeVisible({ timeout: 10000 });

    // Modificar parámetros de crédito
    const amountInput = page.locator('[data-cy="loan-amount"], input[name="amount"]');
    await amountInput.fill('5000000');
    await expect(amountInput).toHaveValue('5000000');

    const installmentsInput = page.locator('[data-cy="loan-installments"], input[name="installments"]');
    await installmentsInput.fill('12');
    await expect(installmentsInput).toHaveValue('12');

    // Click en botón simular
    const simulateBtn = page.locator('[data-cy="btn-simulate"]');
    await simulateBtn.click();

    // Validar resultados calculados
    const monthlyPayment = page.locator('[data-cy="monthly-payment"]');
    await expect(monthlyPayment).toBeVisible({ timeout: 8000 });
    await expect(monthlyPayment).toContainText('$');

    const totalToPay = page.locator('[data-cy="total-to-pay"]');
    await expect(totalToPay).toBeVisible();
    await expect(totalToPay).toContainText('$');
  });

  test('valida inputs del formulario y cálculo dinámico de amortización', async ({ page }) => {
    await page.goto('/loans');

    // Comprobar campos iniciales del simulador
    await expect(page.locator('[data-cy="loan-amount"]')).toBeVisible();
    await expect(page.locator('[data-cy="loan-installments"]')).toBeVisible();
    await expect(page.locator('[data-cy="loan-annual-rate"]')).toBeVisible();
    await expect(page.locator('[data-cy="btn-simulate"]')).toBeEnabled();

    // Simulación alternativa (8 millones a 24 meses)
    await page.locator('[data-cy="loan-amount"]').fill('8000000');
    await page.locator('[data-cy="loan-installments"]').fill('24');
    await page.locator('[data-cy="btn-simulate"]').click();

    await expect(page.locator('[data-cy="monthly-payment"]')).toBeVisible({ timeout: 8000 });
  });
});
