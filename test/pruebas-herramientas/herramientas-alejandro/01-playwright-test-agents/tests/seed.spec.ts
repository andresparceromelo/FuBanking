import { expect, test } from './fixtures';

/**
 * Seed de los Playwright Test Agents. Las fixtures de `./fixtures` ya dejan a
 * una clienta nueva (saldo 500.000, sin bolsillos) con sesión abierta en
 * /pockets; el planner explora desde aquí y el generator copia este import.
 */
test.describe('Bolsillos y Depositar', () => {
  test('seed', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Bolsillos de Ahorro' })).toBeVisible();
  });
});
