/**
 * ============================================================================
 *  Seguridad — Neutralización de contenido en la vista de Bolsillos (XSS)
 * ----------------------------------------------------------------------------
 *  Equivalente frontend de `sanitizar_entrada` del ejemplo `security-testing`
 *  del curso. La API guarda el nombre del bolsillo LITERAL (ver
 *  backend/src/tests/security/pocket/entrada.security.test.ts, SEC-IN-04);
 *  el escape es responsabilidad de la capa que lo pinta. Esta prueba verifica
 *  que PocketsClient lo muestre como TEXTO y que nunca se convierta en HTML
 *  ejecutable (React escapa por defecto y el módulo no usa
 *  dangerouslySetInnerHTML).
 *
 *  Regla SEC-OUT-01: un nombre con HTML/JS se ve literal y no ejecuta nada.
 * ============================================================================
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PocketsClient } from '@/features/pockets/components/PocketsClient';
import { pocketService } from '@/features/pockets/services/pocket.service';
import { accountService } from '@/features/account/services/account.service';

vi.mock('@/features/pockets/services/pocket.service', () => ({
  pocketService: { getByAccount: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), transfer: vi.fn() },
}));

vi.mock('@/features/account/services/account.service', () => ({
  accountService: { getMyAccounts: vi.fn() },
}));

vi.mock('@/shared/components/feedback/ToastProvider', () => ({
  useToast: () => ({ error: vi.fn(), success: vi.fn(), warning: vi.fn() }),
}));

const getByAccount = pocketService.getByAccount as unknown as ReturnType<typeof vi.fn>;
const getMyAccounts = accountService.getMyAccounts as unknown as ReturnType<typeof vi.fn>;

type Window = typeof window & { __xss?: number };

/** [descripción, nombre malicioso, selector que NO debe aparecer en el DOM] */
const PAYLOADS: Array<[string, string, string]> = [
  ['etiqueta script', '<script>window.__xss = 1</script>', 'script'],
  ['imagen con onerror', '<img src="x" onerror="window.__xss = 1">', 'img'],
  ['svg con onload', '<svg onload="window.__xss = 1"></svg>', 'svg[onload]'],
  ['iframe con javascript:', '<iframe src="javascript:window.__xss = 1"></iframe>', 'iframe'],
];

describe('SEC-OUT-01 · PocketsClient muestra nombres maliciosos como texto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as Window).__xss;
    getMyAccounts.mockResolvedValue([{ id: 'acc-1', accountNumber: '1234567890', accountType: 'AHORROS' }]);
  });

  afterEach(() => {
    delete (window as Window).__xss;
  });

  it.each(PAYLOADS)('%s: se ve literal y no crea elementos ni ejecuta código', async (_label, name, selector) => {
    // Arrange
    getByAccount.mockResolvedValue([
      { id: 'p1', accountId: 'acc-1', name, amount: 50_000, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ]);

    // Act
    const { container } = render(<PocketsClient />);
    const heading = await waitFor(() => screen.getByRole('heading', { name }));

    // Assert
    expect(heading.textContent).to.equal(name);
    expect(container.querySelector(selector)).to.be.null;
    expect((window as Window).__xss).to.be.undefined;
  });
});
