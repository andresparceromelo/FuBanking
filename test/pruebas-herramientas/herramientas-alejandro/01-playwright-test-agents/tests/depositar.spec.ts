// spec: test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/specs/bolsillos-depositar.md
// seed: test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/tests/seed.spec.ts

import { expect, test } from './fixtures';

test.describe('Depositar dinero', () => {
  test('DEP-01 · Abonar un monto válido desde /accounts incrementa el saldo de la cuenta', async ({ page, client }) => {
    // 1. Estado inicial (fixture): saldo 500.000, sin bolsillos. Navegar a /accounts.
    await page.goto('/accounts');
    await expect(page.getByRole('heading', { name: 'Cuenta Digital' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mis cuentas' })).toBeVisible();
    await expect(page.getByText('1 cuenta', { exact: true })).toBeVisible();
    const card = page.getByTestId('account-card');
    await expect(card).toHaveCount(1);
    await expect(card.getByText('Cuenta de Ahorros', { exact: true })).toBeVisible();
    const maskedNumber = card.getByText(/^\*{4}\d{4}$/);
    await expect(maskedNumber).toBeVisible();
    const masked = ((await maskedNumber.textContent()) ?? '').trim();
    await expect(card.getByText('Activa', { exact: true })).toBeVisible();
    await expect(card.getByText('Saldo disponible', { exact: true })).toBeVisible();
    // En /accounts el monto usa Intl.NumberFormat('es-CO'): hay un espacio no roto tras el $, por eso \s en la expresión.
    await expect(card.getByTestId('account-balance')).toHaveText(/\$\s*500\.000/);
    expect(await client.api.balance()).toBe(500000);

    // 2. Hacer clic en el botón 'Abonar' (data-testid=deposit-button) de la tarjeta.
    const depositButton = card.getByTestId('deposit-button');
    await expect(depositButton).toHaveText('Abonar');
    await depositButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Agregar Dinero (Depósito)' })).toBeVisible();
    await expect(dialog.getByText(`Cuenta N° ${masked}`)).toBeVisible();
    await expect(dialog.getByText('Monto a ingresar (COP)')).toBeVisible();
    await expect(dialog.locator('#dw-amount')).toHaveAttribute('placeholder', '0.00');
    await expect(dialog.getByText('Descripción / Concepto (opcional)')).toBeVisible();
    await expect(dialog.locator('#dw-description')).toHaveAttribute('placeholder', 'Abono en efectivo');
    await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeVisible();
    await expect(dialog.getByTestId('dw-submit')).toHaveText('Abonar Saldo');

    // 3. Escribir '150000' en 'Monto a ingresar (COP)' y 'Abono de prueba' en la descripción; hacer clic en 'Abonar Saldo'.
    await dialog.locator('#dw-amount').fill('150000');
    await dialog.locator('#dw-description').fill('Abono de prueba');
    await dialog.getByTestId('dw-submit').click();
    await expect(page.getByTestId('toast-title').filter({ hasText: 'Deposito realizado' })).toBeVisible();
    await expect(page.getByText(`Cuenta ${masked} actualizada correctamente.`)).toBeVisible();
    await expect(dialog).toHaveCount(0);

    // 4. Esperar a que la lista de cuentas se refresque y leer el saldo de la tarjeta.
    await expect(card.getByTestId('account-balance')).toHaveText(/\$\s*650\.000/);

    // 5. Verificar en backend con el oráculo.
    expect(await client.api.balance()).toBe(650000);
  });

  test('DEP-02 · Abonar con monto 0 (o negativo) muestra un error en línea y no cambia el saldo', async ({ page, client }) => {
    // 1. Estado inicial (fixture): saldo 500.000. Navegar a /accounts, hacer clic en 'Abonar' y esperar el modal 'Agregar Dinero (Depósito)'.
    await page.goto('/accounts');
    const card = page.getByTestId('account-card');
    await expect(card).toHaveCount(1);
    await card.getByTestId('deposit-button').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Agregar Dinero (Depósito)' })).toBeVisible();
    await expect(dialog.getByTestId('dw-error')).toHaveCount(0);

    // 2. Escribir '0' en 'Monto a ingresar (COP)' y hacer clic en 'Abonar Saldo'.
    const error = dialog.getByTestId('dw-error');
    await dialog.locator('#dw-amount').fill('0');
    await dialog.getByTestId('dw-submit').click();
    await expect(error).toHaveText('Por favor ingresa un monto válido mayor a cero.');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('#dw-amount')).toHaveValue('0');
    await expect(page.getByTestId('toast-title').filter({ hasText: 'Deposito realizado' })).toHaveCount(0);

    // 3. Reemplazar el monto por '-5000' y hacer clic en 'Abonar Saldo'.
    await dialog.locator('#dw-amount').fill('-5000');
    await dialog.getByTestId('dw-submit').click();
    await expect(error).toHaveText('Por favor ingresa un monto válido mayor a cero.');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('#dw-amount')).toHaveValue('-5000');

    // 4. Hacer clic en 'Cancelar' y revisar el saldo.
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(card.getByTestId('account-balance')).toHaveText(/\$\s*500\.000/);
    await expect(page.getByTestId('toast-title').filter({ hasText: 'Deposito realizado' })).toHaveCount(0);

    // 5. Verificar en backend con el oráculo.
    expect(await client.api.balance()).toBe(500000);
  });
});
