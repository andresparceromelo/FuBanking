// spec: test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/specs/bolsillos-depositar.md
// seed: test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/tests/seed.spec.ts

import { expect, test } from './fixtures';

const API_URL = (process.env.E2E_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');

test.describe('Eliminar bolsillo', () => {
  test('ELI-01 · Eliminar un bolsillo confirmando el diálogo devuelve su saldo a la cuenta', async ({ page, client }) => {
    // 1. Estado inicial: fixture + precondición por API (Vacaciones, 100.000); recargar /pockets.
    await client.api.createPocket('Vacaciones', 100000);
    await page.reload();
    await expect(page.locator('#account-select')).not.toHaveValue('');
    await expect(page.getByTestId('pocket-card')).toHaveCount(1);
    const card = page.getByTestId('pocket-card').filter({ hasText: 'Vacaciones' });
    await expect(card.getByTestId('pocket-card-name')).toHaveText('Vacaciones');
    await expect(card.getByTestId('pocket-card-amount')).toHaveText('$ 100.000');
    expect(await client.api.balance()).toBe(400000);

    // 2. En la tarjeta 'Vacaciones' hacer clic en el botón 'Eliminar' (nombre exacto 'Eliminar').
    await card.getByRole('button', { name: 'Eliminar', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Eliminar bolsillo' })).toBeVisible();
    await expect(dialog.getByText('Esta acción devolverá el saldo a tu cuenta.')).toBeVisible();
    await expect(dialog.getByText('¿Deseas eliminar')).toBeVisible();
    await expect(dialog.getByText('Vacaciones?')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeVisible();
    await expect(dialog.getByTestId('confirm-delete-pocket-button')).toHaveText('Sí, eliminar');
    expect(await client.api.pockets()).toHaveLength(1);

    // 3. Hacer clic en 'Sí, eliminar'.
    await dialog.getByTestId('confirm-delete-pocket-button').click();
    await expect(page.getByTestId('toast-title').filter({ hasText: 'Bolsillo eliminado' })).toBeVisible();
    await expect(page.getByText('El saldo volvió a la cuenta correctamente.')).toBeVisible();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId('pocket-card')).toHaveCount(0);
    await expect(page.getByTestId('pockets-empty')).toHaveText('No hay bolsillos para esta cuenta aún.');

    // 4. Verificar en backend con el oráculo y en /accounts.
    expect(await client.api.pockets()).toEqual([]);
    expect(await client.api.balance()).toBe(500000);
    await page.goto('/accounts');
    await expect(page.getByTestId('account-balance')).toHaveText(/\$\s*500\.000/);
  });

  test('ELI-02 · Cancelar la confirmación no elimina y eliminar un bolsillo ya borrado muestra un error', async ({ page, client, request }) => {
    // 1. Estado inicial: fixture + precondición por API (Vacaciones, 100.000); recargar /pockets, hacer clic en 'Eliminar' y esperar el diálogo.
    const id = await client.api.createPocket('Vacaciones', 100000);
    await page.reload();
    await expect(page.locator('#account-select')).not.toHaveValue('');
    await expect(page.getByTestId('pocket-card')).toHaveCount(1);
    const card = page.getByTestId('pocket-card').filter({ hasText: 'Vacaciones' });
    const dialog = page.getByRole('dialog');
    await card.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(dialog.getByRole('heading', { name: 'Eliminar bolsillo' })).toBeVisible();
    await expect(dialog.getByText('Vacaciones?')).toBeVisible();

    // 2. Hacer clic en 'Cancelar' del diálogo.
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(card.getByTestId('pocket-card-amount')).toHaveText('$ 100.000');
    await expect(page.getByTestId('toast-title').filter({ hasText: 'Bolsillo eliminado' })).toHaveCount(0);
    expect(await client.api.pockets()).toHaveLength(1);
    expect(await client.api.balance()).toBe(400000);

    // 3. Simular un borrado concurrente (pantalla desactualizada): DELETE directo a la API y, sin recargar, intentar eliminar la tarjeta que sigue en pantalla.
    const concurrentDelete = await request.delete(`${API_URL}/pockets/${id}`, { headers: { Authorization: `Bearer ${client.token}` } });
    expect(concurrentDelete.status()).toBe(200);
    await card.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(dialog.getByRole('heading', { name: 'Eliminar bolsillo' })).toBeVisible();
    await dialog.getByTestId('confirm-delete-pocket-button').click();
    await expect(page.getByTestId('toast-title').filter({ hasText: 'No fue posible eliminar el bolsillo' })).toBeVisible();
    await expect(page.getByText('Bolsillo no encontrado')).toBeVisible();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId('toast-title').filter({ hasText: 'Bolsillo eliminado' })).toHaveCount(0);

    // 4. Verificar en backend con el oráculo.
    expect(await client.api.pockets()).toEqual([]);
    expect(await client.api.balance()).toBe(500000);
  });
});
