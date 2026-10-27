// spec: test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/specs/bolsillos-depositar.md
// seed: test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/tests/seed.spec.ts

import { expect, test } from './fixtures';

test.describe('Consultar bolsillos', () => {
  test('CON-01 · La lista "Bolsillos actuales" muestra los bolsillos existentes con sus montos', async ({ page, client }) => {
    // 1. Estado inicial: fixture (saldo 500.000, sin bolsillos). Precondición por API: Vacaciones (100.000) y Emergencias (50.000); recargar y esperar a #account-select.
    const id1 = await client.api.createPocket('Vacaciones', 100000);
    const id2 = await client.api.createPocket('Emergencias', 50000);
    await page.reload();
    await expect(page.locator('#account-select')).not.toHaveValue('');
    const pockets = await client.api.pockets();
    expect(pockets).toHaveLength(2);
    expect(pockets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: id1, name: 'Vacaciones', amount: 100000 }),
        expect.objectContaining({ id: id2, name: 'Emergencias', amount: 50000 }),
      ]),
    );
    expect(await client.api.balance()).toBe(350000);

    // 2. Leer la tarjeta 'Bolsillos actuales'.
    await expect(page.getByTestId('pocket-card')).toHaveCount(2);
    await expect(page.getByTestId('pockets-empty')).toHaveCount(0);

    const vacaciones = page.getByTestId('pocket-card').filter({ hasText: 'Vacaciones' });
    await expect(vacaciones.getByTestId('pocket-card-name')).toHaveText('Vacaciones');
    await expect(vacaciones.getByTestId('pocket-card-amount')).toHaveText('$ 100.000');
    await expect(vacaciones.getByTestId('edit-pocket-button')).toHaveText('Editar');
    await expect(vacaciones.getByTestId('delete-pocket-button')).toHaveText('Eliminar');
    await expect(vacaciones).toContainText(id1);

    const emergencias = page.getByTestId('pocket-card').filter({ hasText: 'Emergencias' });
    await expect(emergencias.getByTestId('pocket-card-name')).toHaveText('Emergencias');
    await expect(emergencias.getByTestId('pocket-card-amount')).toHaveText('$ 50.000');
    await expect(emergencias.getByTestId('edit-pocket-button')).toHaveText('Editar');
    await expect(emergencias.getByTestId('delete-pocket-button')).toHaveText('Eliminar');
    await expect(emergencias).toContainText(id2);

    // 3. Abrir/inspeccionar los selects 'Bolsillo origen' y 'Bolsillo destino'.
    // El orden de las opciones depende del backend: se comprueba el conjunto, no la posición.
    for (const select of ['#from-pocket-select', '#to-pocket-select']) {
      const options = page.locator(`${select} option`);
      await expect(options).toHaveCount(3);
      await expect(options.filter({ hasText: 'Selecciona un bolsillo' })).toHaveCount(1);
      await expect(options.filter({ hasText: 'Vacaciones · $ 100.000' })).toHaveCount(1);
      await expect(options.filter({ hasText: 'Emergencias · $ 50.000' })).toHaveCount(1);
    }

    // 4. Inspeccionar el selector 'Cuenta' (#account-select).
    const accountOptions = page.locator('#account-select option');
    await expect(accountOptions).toHaveCount(1);
    await expect(accountOptions).toHaveText(/^\S+ · AHORROS$/);
    await expect(page.locator('#account-select')).toHaveValue(client.accountId);

    // 5. Navegar a /accounts y leer el saldo de la tarjeta de cuenta.
    await page.goto('/accounts');
    const accountCard = page.getByTestId('account-card');
    await expect(accountCard).toHaveCount(1);
    await expect(accountCard).toContainText('Cuenta de Ahorros');
    await expect(accountCard).toContainText('Saldo disponible');
    await expect(accountCard.getByTestId('account-balance')).toHaveText(/\$\s*350\.000/);
    expect(await client.api.balance()).toBe(350000);
  });

  test('CON-02 · Cuenta sin bolsillos muestra estado vacío y una falla de la API al cargar muestra un error', async ({ page, client }) => {
    // 1. Estado inicial (fixture, sin precondiciones): saldo 500.000 y sin bolsillos, en /pockets.
    await expect(page.getByTestId('pockets-empty')).toHaveText('No hay bolsillos para esta cuenta aún.');
    await expect(page.getByTestId('pocket-card')).toHaveCount(0);
    await expect(page.locator('#from-pocket-select option')).toHaveText(['Selecciona un bolsillo']);
    await expect(page.locator('#to-pocket-select option')).toHaveText(['Selecciona un bolsillo']);
    await expect(page.getByTestId('toast-title')).toHaveCount(0);
    expect(await client.api.pockets()).toEqual([]);

    // 2. Inyección de fallo: la API de bolsillos responde 500 y se recarga la página.
    // El front (:3000) llama a la API (:3001), que es otro origen: la respuesta simulada
    // lleva cabeceras CORS y el preflight (OPTIONS) se responde aparte.
    const corsHeaders = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, content-type',
      'access-control-allow-methods': 'GET, OPTIONS',
    };
    await page.route('**/pockets/account/**', (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: corsHeaders });
      }
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Ha ocurrido un error interno',
          error: { code: 'INTERNAL_ERROR', message: 'Ha ocurrido un error interno' },
        }),
      });
    });
    await page.reload();
    await expect(page.getByTestId('toast-title').filter({ hasText: 'No fue posible cargar los bolsillos' })).toBeVisible();
    await expect(page.getByText('Ha ocurrido un error interno')).toBeVisible();
    await expect(page.getByTestId('pockets-empty')).toBeVisible();
    await expect(page.getByTestId('pocket-card')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Nuevo bolsillo' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Transferir entre bolsillos' })).toBeVisible();
    await expect(page.getByTestId('create-pocket-button')).toBeVisible();
    await expect(page.getByTestId('transfer-pockets-button')).toBeVisible();

    // 3. Quitar la ruta interceptada (page.unroute) y recargar de nuevo.
    await page.unroute('**/pockets/account/**');
    const pocketsResponse = page.waitForResponse((response) => response.url().includes('/pockets/account/') && response.request().method() === 'GET');
    await page.reload();
    expect((await pocketsResponse).status()).toBeLessThan(400);
    await expect(page.getByTestId('create-pocket-button')).toBeEnabled();
    await expect(page.getByTestId('pockets-empty')).toHaveText('No hay bolsillos para esta cuenta aún.');
    await expect(page.getByTestId('toast-title')).toHaveCount(0);
    expect(await client.api.balance()).toBe(500000);
    expect(await client.api.pockets()).toEqual([]);
  });
});
