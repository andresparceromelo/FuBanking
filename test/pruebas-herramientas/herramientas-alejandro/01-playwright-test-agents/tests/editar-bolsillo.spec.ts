// spec: test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/specs/bolsillos-depositar.md
// seed: test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/tests/seed.spec.ts

import { expect, test } from './fixtures';

test.describe('Editar bolsillo', () => {
  test('EDI-01 · Editar nombre y monto de un bolsillo actualiza la tarjeta y ajusta el saldo', async ({ page, client }) => {
    // 1. Estado inicial: fixture + precondición por API (Vacaciones, 100.000); recargar /pockets.
    const id = await client.api.createPocket('Vacaciones', 100000);
    await page.reload();
    await expect(page.locator('#account-select')).not.toHaveValue('');
    await expect(page.getByTestId('pocket-card')).toHaveCount(1);
    const card = page.getByTestId('pocket-card').filter({ hasText: 'Vacaciones' });
    await expect(card.getByTestId('pocket-card-name')).toHaveText('Vacaciones');
    await expect(card.getByTestId('pocket-card-amount')).toHaveText('$ 100.000');
    expect(await client.api.balance()).toBe(400000);

    // 2. En la tarjeta 'Vacaciones' hacer clic en el botón 'Editar'.
    await card.getByTestId('edit-pocket-button').click();
    const nameInput = page.locator('#edit-pocket-name');
    const amountInput = page.locator('#edit-pocket-amount');
    await expect(nameInput).toHaveValue('Vacaciones');
    await expect(amountInput).toHaveValue('100000');
    await expect(page.getByTestId('save-pocket-button')).toHaveText('Guardar');
    await expect(card.getByRole('button', { name: 'Cancelar' })).toBeVisible();
    await expect(page.getByTestId('edit-pocket-button')).toHaveCount(0);
    await expect(page.getByTestId('delete-pocket-button')).toHaveCount(0);

    // 3. Reemplazar el nombre por 'Viaje a Cartagena' y el monto por '150000' y hacer clic en 'Guardar'.
    await nameInput.fill('Viaje a Cartagena');
    await amountInput.fill('150000');
    await page.getByTestId('save-pocket-button').click();
    await expect(page.getByTestId('toast-title').filter({ hasText: 'Bolsillo actualizado' })).toBeVisible();
    await expect(page.getByText('Los cambios quedaron guardados.')).toBeVisible();
    await expect(nameInput).toHaveCount(0);
    await expect(amountInput).toHaveCount(0);
    await expect(page.getByTestId('save-pocket-button')).toHaveCount(0);
    await expect(page.getByTestId('edit-pocket-button')).toHaveText('Editar');
    await expect(page.getByTestId('delete-pocket-button')).toHaveText('Eliminar');

    // 4. Leer la tarjeta actualizada.
    await expect(page.getByTestId('pocket-card')).toHaveCount(1);
    const updatedCard = page.getByTestId('pocket-card').filter({ hasText: 'Viaje a Cartagena' });
    await expect(updatedCard.getByTestId('pocket-card-name')).toHaveText('Viaje a Cartagena');
    await expect(updatedCard.getByTestId('pocket-card-amount')).toHaveText('$ 150.000');
    await expect(page.getByTestId('pocket-card').filter({ hasText: 'Vacaciones' })).toHaveCount(0);

    // 5. Verificar en backend con el oráculo.
    expect(await client.api.pockets()).toMatchObject([{ id, name: 'Viaje a Cartagena', amount: 150000 }]);
    expect(await client.api.balance()).toBe(350000);
  });

  test('EDI-02 · Editar con nombre vacío o con un monto mayor al disponible es rechazado sin modificar nada', async ({ page, client }) => {
    // 1. Estado inicial: fixture + precondición por API (Vacaciones, 100.000); recargar /pockets y hacer clic en 'Editar'.
    await client.api.createPocket('Vacaciones', 100000);
    await page.reload();
    await expect(page.locator('#account-select')).not.toHaveValue('');
    await expect(page.getByTestId('pocket-card')).toHaveCount(1);
    const card = page.getByTestId('pocket-card').filter({ hasText: 'Vacaciones' });
    await card.getByTestId('edit-pocket-button').click();
    const nameInput = page.locator('#edit-pocket-name');
    const amountInput = page.locator('#edit-pocket-amount');
    const saveButton = page.getByTestId('save-pocket-button');
    const cancelButton = card.getByRole('button', { name: 'Cancelar' });
    await expect(nameInput).toHaveValue('Vacaciones');
    await expect(amountInput).toHaveValue('100000');
    expect(await client.api.balance()).toBe(400000);

    // 2. Borrar por completo el campo 'Nombre' (#edit-pocket-name) y hacer clic en 'Guardar'.
    await nameInput.fill('');
    await saveButton.click();
    await expect(page.getByTestId('toast-title').filter({ hasText: 'Nombre inválido' })).toBeVisible();
    await expect(page.getByText('El nombre del bolsillo no puede quedar vacío.')).toBeVisible();
    await expect(saveButton).toBeVisible();
    await expect(cancelButton).toBeVisible();

    // 3. Escribir de nuevo 'Vacaciones' en 'Nombre', poner '700000' en 'Monto' (mayor que el disponible) y hacer clic en 'Guardar'.
    await nameInput.fill('Vacaciones');
    await amountInput.fill('700000');
    await saveButton.click();
    await expect(page.getByTestId('toast-title').filter({ hasText: 'No fue posible actualizar el bolsillo' })).toBeVisible();
    await expect(page.getByText('No tienes saldo disponible suficiente para ajustar este bolsillo')).toBeVisible();
    await expect(saveButton).toBeVisible();
    await expect(cancelButton).toBeVisible();

    // 4. Hacer clic en 'Cancelar'.
    await cancelButton.click();
    await expect(nameInput).toHaveCount(0);
    await expect(amountInput).toHaveCount(0);
    await expect(saveButton).toHaveCount(0);
    await expect(page.getByTestId('pocket-card')).toHaveCount(1);
    const unchangedCard = page.getByTestId('pocket-card').filter({ hasText: 'Vacaciones' });
    await expect(unchangedCard.getByTestId('pocket-card-name')).toHaveText('Vacaciones');
    await expect(unchangedCard.getByTestId('pocket-card-amount')).toHaveText('$ 100.000');
    await expect(unchangedCard.getByTestId('edit-pocket-button')).toHaveText('Editar');

    // 5. Verificar en backend con el oráculo.
    expect(await client.api.pockets()).toMatchObject([{ name: 'Vacaciones', amount: 100000 }]);
    expect(await client.api.balance()).toBe(400000);
  });
});
