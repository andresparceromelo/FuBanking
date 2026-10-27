// spec: test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/specs/bolsillos-depositar.md
// seed: test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/tests/seed.spec.ts

import { expect, test } from './fixtures';

test.describe('Transferir entre bolsillos', () => {
  test('TRA-01 · Transferir un monto entre dos bolsillos mueve el saldo sin tocar la cuenta', async ({ page, client }) => {
    // 1. Estado inicial: fixture + precondición por API (Vacaciones 100.000 y Emergencias 50.000); recargar /pockets.
    await client.api.createPocket('Vacaciones', 100000);
    await client.api.createPocket('Emergencias', 50000);
    await page.reload();
    await expect(page.locator('#account-select')).not.toHaveValue('');
    await expect(page.getByTestId('pocket-card')).toHaveCount(2);
    const vacaciones = page.getByTestId('pocket-card').filter({ hasText: 'Vacaciones' });
    const emergencias = page.getByTestId('pocket-card').filter({ hasText: 'Emergencias' });
    await expect(vacaciones.getByTestId('pocket-card-amount')).toHaveText('$ 100.000');
    await expect(emergencias.getByTestId('pocket-card-amount')).toHaveText('$ 50.000');
    expect(await client.api.balance()).toBe(350000);

    // 2. En 'Transferir entre bolsillos' elegir 'Vacaciones · $ 100.000' como origen, 'Emergencias · $ 50.000' como destino y escribir '30000' en 'Monto'.
    const fromSelect = page.locator('#from-pocket-select');
    const toSelect = page.locator('#to-pocket-select');
    await fromSelect.selectOption({ label: 'Vacaciones · $ 100.000' });
    await toSelect.selectOption({ label: 'Emergencias · $ 50.000' });
    await page.locator('#transfer-amount').fill('30000');
    await expect(fromSelect.locator('option:checked')).toHaveText('Vacaciones · $ 100.000');
    await expect(toSelect.locator('option:checked')).toHaveText('Emergencias · $ 50.000');
    await expect(page.locator('#transfer-amount')).toHaveValue('30000');

    // 3. Hacer clic en el botón 'Transferir'.
    await page.getByTestId('transfer-pockets-button').click();
    await expect(page.getByTestId('toast-title').filter({ hasText: 'Transferencia realizada' })).toBeVisible();
    await expect(page.getByText('Vacaciones → Emergencias')).toBeVisible();
    // La lista se recarga un instante después del toast: se usan aserciones con reintento.
    await expect(vacaciones.getByTestId('pocket-card-amount')).toHaveText('$ 70.000');
    await expect(emergencias.getByTestId('pocket-card-amount')).toHaveText('$ 80.000');
    await expect(fromSelect.locator('option', { hasText: 'Vacaciones · $ 70.000' })).toHaveCount(1);
    await expect(fromSelect.locator('option', { hasText: 'Emergencias · $ 80.000' })).toHaveCount(1);
    await expect(toSelect.locator('option', { hasText: 'Vacaciones · $ 70.000' })).toHaveCount(1);
    await expect(toSelect.locator('option', { hasText: 'Emergencias · $ 80.000' })).toHaveCount(1);

    // 4. Verificar en backend con el oráculo.
    const pockets = await client.api.pockets();
    expect(pockets).toHaveLength(2);
    expect(pockets.find((pocket) => pocket.name === 'Vacaciones')?.amount).toBe(70000);
    expect(pockets.find((pocket) => pocket.name === 'Emergencias')?.amount).toBe(80000);
    expect(pockets.reduce((total, pocket) => total + pocket.amount, 0)).toBe(150000);
    expect(await client.api.balance()).toBe(350000);
  });

  test('TRA-02 · Transferir sin datos, más de lo disponible o al mismo bolsillo es rechazado', async ({ page, client }) => {
    // 1. Estado inicial: fixture + precondición por API (Vacaciones 100.000 y Emergencias 50.000); recargar /pockets. Sin tocar ningún campo, hacer clic en 'Transferir'.
    await client.api.createPocket('Vacaciones', 100000);
    await client.api.createPocket('Emergencias', 50000);
    await page.reload();
    await expect(page.locator('#account-select')).not.toHaveValue('');
    await expect(page.getByTestId('pocket-card')).toHaveCount(2);
    const vacaciones = page.getByTestId('pocket-card').filter({ hasText: 'Vacaciones' });
    const emergencias = page.getByTestId('pocket-card').filter({ hasText: 'Emergencias' });
    const fromSelect = page.locator('#from-pocket-select');
    const toSelect = page.locator('#to-pocket-select');
    const transferButton = page.getByTestId('transfer-pockets-button');

    await transferButton.click();
    await expect(page.getByTestId('toast-title').filter({ hasText: 'Falta información' })).toBeVisible();
    await expect(page.getByText('Selecciona los bolsillos y un monto para transferir.')).toBeVisible();
    await expect(vacaciones.getByTestId('pocket-card-amount')).toHaveText('$ 100.000');
    await expect(emergencias.getByTestId('pocket-card-amount')).toHaveText('$ 50.000');

    // 2. Elegir 'Emergencias · $ 50.000' como origen, 'Vacaciones · $ 100.000' como destino, escribir '80000' en 'Monto' (mayor que los 50.000 del origen) y hacer clic en 'Transferir'.
    await fromSelect.selectOption({ label: 'Emergencias · $ 50.000' });
    await toSelect.selectOption({ label: 'Vacaciones · $ 100.000' });
    await page.locator('#transfer-amount').fill('80000');
    await transferButton.click();
    await expect(page.getByTestId('toast-title').filter({ hasText: 'No fue posible transferir el saldo' })).toBeVisible();
    await expect(page.getByText('Saldo insuficiente en el bolsillo de origen')).toBeVisible();
    await expect(vacaciones.getByTestId('pocket-card-amount')).toHaveText('$ 100.000');
    await expect(emergencias.getByTestId('pocket-card-amount')).toHaveText('$ 50.000');

    // 3. Elegir 'Vacaciones' como origen Y como destino, escribir '10000' en 'Monto' y hacer clic en 'Transferir'.
    // El título del toast es el mismo que el del paso anterior: se cierra ese toast para asegurar que el siguiente es uno nuevo.
    const insufficientToast = page.locator('[aria-live="polite"] > div').filter({ hasText: 'Saldo insuficiente en el bolsillo de origen' });
    await insufficientToast.getByRole('button', { name: 'Cerrar notificacion' }).click();
    await expect(insufficientToast).toHaveCount(0);
    await fromSelect.selectOption({ label: 'Vacaciones · $ 100.000' });
    await toSelect.selectOption({ label: 'Vacaciones · $ 100.000' });
    await page.locator('#transfer-amount').fill('10000');
    await transferButton.click();
    await expect(page.getByTestId('toast-title').filter({ hasText: 'No fue posible transferir el saldo' })).toBeVisible();
    await expect(page.getByText('Los bolsillos de origen y destino deben ser diferentes')).toBeVisible();
    await expect(vacaciones.getByTestId('pocket-card-amount')).toHaveText('$ 100.000');
    await expect(emergencias.getByTestId('pocket-card-amount')).toHaveText('$ 50.000');

    // 4. Verificar en backend con el oráculo.
    const pockets = await client.api.pockets();
    expect(pockets).toHaveLength(2);
    expect(pockets.find((pocket) => pocket.name === 'Vacaciones')?.amount).toBe(100000);
    expect(pockets.find((pocket) => pocket.name === 'Emergencias')?.amount).toBe(50000);
    expect(await client.api.balance()).toBe(350000);
  });
});
