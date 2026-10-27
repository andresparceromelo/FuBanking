// spec: test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/specs/bolsillos-depositar.md
// seed: test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/tests/seed.spec.ts

import { expect, test } from './fixtures';

test.describe('Crear bolsillo', () => {
  test('CRE-01 · Crear un bolsillo con nombre y monto válidos descuenta el saldo de la cuenta', async ({ page, client }) => {
    // 1. Estado inicial (fixture): clienta nueva en /pockets, saldo 500.000, sin bolsillos. Verificar el punto de partida con el oráculo.
    await expect(page.getByRole('heading', { name: 'Bolsillos de Ahorro' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nuevo bolsillo' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Transferir entre bolsillos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bolsillos actuales' })).toBeVisible();
    await expect(page.getByTestId('pockets-empty')).toHaveText('No hay bolsillos para esta cuenta aún.');
    await expect(page.getByTestId('pocket-card')).toHaveCount(0);
    expect(await client.api.balance()).toBe(500000);
    expect(await client.api.pockets()).toEqual([]);

    // 2. Escribir 'Vacaciones' en 'Nombre del bolsillo' y '100000' en 'Monto inicial'.
    const createButton = page.getByTestId('create-pocket-button');
    await page.locator('#pocket-name').fill('Vacaciones');
    await page.locator('#pocket-amount').fill('100000');
    await expect(page.locator('#pocket-name')).toHaveValue('Vacaciones');
    await expect(page.locator('#pocket-amount')).toHaveValue('100000');
    await expect(createButton).toBeEnabled();

    // 3. Hacer clic en el botón 'Crear bolsillo'.
    await createButton.click();
    await expect(page.getByTestId('toast-title').filter({ hasText: 'Bolsillo creado' })).toBeVisible();
    await expect(page.getByText('Tu ahorro quedó organizado correctamente.')).toBeVisible();
    await expect(page.locator('#pocket-name')).toHaveValue('');
    await expect(page.locator('#pocket-amount')).toHaveValue('');

    // 4. Observar la lista 'Bolsillos actuales'.
    await expect(page.getByTestId('pockets-empty')).toHaveCount(0);
    await expect(page.getByTestId('pocket-card')).toHaveCount(1);
    const card = page.getByTestId('pocket-card').filter({ hasText: 'Vacaciones' });
    await expect(card.getByTestId('pocket-card-name')).toHaveText('Vacaciones');
    await expect(card.getByTestId('pocket-card-amount')).toHaveText('$ 100.000');
    await expect(page.locator('#from-pocket-select option')).toHaveText(['Selecciona un bolsillo', 'Vacaciones · $ 100.000']);
    await expect(page.locator('#to-pocket-select option')).toHaveText(['Selecciona un bolsillo', 'Vacaciones · $ 100.000']);

    // 5. Verificar en backend con el oráculo y, opcionalmente, en /accounts.
    expect(await client.api.pockets()).toMatchObject([{ name: 'Vacaciones', amount: 100000 }]);
    expect(await client.api.balance()).toBe(400000);
    await page.goto('/accounts');
    await expect(page.getByTestId('account-balance')).toHaveText(/\$\s*400\.000/);
  });

  test('CRE-02 · Crear bolsillo sin nombre o con monto superior al saldo es rechazado y no cambia el saldo', async ({ page, client }) => {
    const createButton = page.getByTestId('create-pocket-button');
    const nameInput = page.locator('#pocket-name');
    const amountInput = page.locator('#pocket-amount');

    // 1. Estado inicial (fixture): saldo 500.000, sin bolsillos, en /pockets. Dejar 'Nombre del bolsillo' vacío y escribir '50000' en 'Monto inicial'.
    await expect(page.getByTestId('pockets-empty')).toBeVisible();
    await amountInput.fill('50000');
    await expect(nameInput).toHaveValue('');
    await expect(amountInput).toHaveValue('50000');

    // 2. Hacer clic en 'Crear bolsillo'.
    await createButton.click();
    const missingInfoToast = page.getByTestId('toast-title').filter({ hasText: 'Falta información' });
    await expect(missingInfoToast).toBeVisible();
    await expect(page.getByText('Selecciona una cuenta y escribe el nombre del bolsillo.')).toBeVisible();
    await expect(page.getByTestId('pockets-empty')).toBeVisible();
    await expect(page.getByTestId('pocket-card')).toHaveCount(0);

    // 3. Variante de espacios: escribir '   ' (solo espacios) en 'Nombre del bolsillo' y volver a hacer clic en 'Crear bolsillo'.
    // Se cierra el primer toast para asegurar que el siguiente es uno nuevo y no el anterior.
    await page.getByRole('button', { name: 'Cerrar notificacion' }).click();
    await expect(missingInfoToast).toBeHidden();
    await nameInput.fill('   ');
    await createButton.click();
    await expect(missingInfoToast).toBeVisible();
    await expect(page.getByText('Selecciona una cuenta y escribe el nombre del bolsillo.')).toBeVisible();
    await expect(page.getByTestId('pockets-empty')).toBeVisible();
    await expect(page.getByTestId('pocket-card')).toHaveCount(0);

    // 4. Escribir 'Casa propia' en 'Nombre del bolsillo' y '600000' en 'Monto inicial' (mayor que el saldo de 500.000) y hacer clic en 'Crear bolsillo'.
    await nameInput.fill('Casa propia');
    await amountInput.fill('600000');
    await createButton.click();
    await expect(page.getByTestId('toast-title').filter({ hasText: 'No fue posible crear el bolsillo' })).toBeVisible();
    await expect(page.getByText('No tienes saldo disponible suficiente para crear este bolsillo')).toBeVisible();
    await expect(nameInput).toHaveValue('Casa propia');
    await expect(amountInput).toHaveValue('600000');
    await expect(page.getByTestId('pocket-card')).toHaveCount(0);

    // 5. Verificar en backend con el oráculo.
    expect(await client.api.pockets()).toEqual([]);
    expect(await client.api.balance()).toBe(500000);
  });
});
