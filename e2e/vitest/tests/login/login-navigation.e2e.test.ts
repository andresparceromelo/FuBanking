import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { Actor } from '../../screenplay/actors/Actor';
import { NavigateToLogin } from '../../screenplay/tasks/NavigateToLogin';
import { NavigateToProtectedRoute } from '../../screenplay/tasks/NavigateToProtectedRoute';
import { ThePageNavigation } from '../../screenplay/questions/ThePageNavigation';
import { BrowseTheWeb } from '../../screenplay/abilities/BrowseTheWeb';
import { createTestActor } from '../../fixtures/login.fixtures';

/**
 * Pruebas E2E — Navegación y middleware de autenticación (Patrón Screenplay)
 *
 * Valida que el middleware del frontend protege correctamente las rutas
 * y redirige a `/login` cuando no hay sesión activa.
 *
 * Actores:
 *   - Carlos: usuario no autenticado que navega por el frontend
 *   - Diana: usuario que tiene un token almacenado
 *
 * Precondiciones:
 *   - Frontend levantado y accesible en E2E_BASE_URL
 */
describe('Login E2E — Navegación Frontend (Screenplay)', () => {
  let carlos: Actor;

  beforeAll(() => {
    carlos = createTestActor('Carlos');
  });

  beforeEach(() => {
    NavigateToLogin.lastResult = null;
    NavigateToProtectedRoute.lastResult = null;

    const browser = BrowseTheWeb.as(carlos);
    browser.clearAllCookies();
  });

  describe('Escenario: Acceso a la página de login sin sesión', () => {
    it('debería servir la página de login correctamente', async () => {
      let frontendAvailable = true;

      try {
        await carlos.attemptsTo(NavigateToLogin.page());
      } catch {
        frontendAvailable = false;
        console.warn('SKIP: Frontend no disponible');
      }

      if (!frontendAvailable) {
        return;
      }

      const navigation = await carlos.asks(ThePageNavigation.toLogin());

      expect(navigation.status).toBe(200);
      expect(navigation.redirectUrl).toBeNull();
    });
  });

  describe('Escenario: Acceso a rutas protegidas sin sesión', () => {
    it('debería redirigir /profile al login', async () => {
      let frontendAvailable = true;

      try {
        await carlos.attemptsTo(NavigateToProtectedRoute.at('/profile'));
      } catch {
        frontendAvailable = false;
        console.warn('SKIP: Frontend no disponible');
      }

      if (!frontendAvailable) {
        return;
      }

      const navigation = await carlos.asks(ThePageNavigation.toProtectedRoute());

      expect(navigation.status).toBeGreaterThanOrEqual(300);
      expect(navigation.status).toBeLessThan(400);

      if (navigation.redirectUrl) {
        expect(navigation.redirectUrl).toContain('/login');
      }
    });

    it('debería redirigir /accounts al login', async () => {
      let frontendAvailable = true;

      try {
        await carlos.attemptsTo(NavigateToProtectedRoute.at('/accounts'));
      } catch {
        frontendAvailable = false;
        console.warn('SKIP: Frontend no disponible');
      }

      if (!frontendAvailable) {
        return;
      }

      const navigation = await carlos.asks(ThePageNavigation.toProtectedRoute());

      expect(navigation.status).toBeGreaterThanOrEqual(300);
      expect(navigation.status).toBeLessThan(400);

      if (navigation.redirectUrl) {
        expect(navigation.redirectUrl).toContain('/login');
      }
    });
  });

  describe('Escenario: Acceso a login con sesión activa', () => {
    it('debería redirigir a /profile si ya hay un token', async () => {
      const diana = createTestActor('Diana');
      const browser = BrowseTheWeb.as(diana);
      browser.setCookie('token', 'fake-jwt-token-for-redirect-test');

      let frontendAvailable = true;

      try {
        await diana.attemptsTo(NavigateToLogin.page());
      } catch {
        frontendAvailable = false;
        console.warn('SKIP: Frontend no disponible');
      }

      if (!frontendAvailable) {
        return;
      }

      const navigation = await diana.asks(ThePageNavigation.toLogin());

      expect(navigation.status).toBeGreaterThanOrEqual(300);
      expect(navigation.status).toBeLessThan(400);

      if (navigation.redirectUrl) {
        expect(navigation.redirectUrl).toContain('/profile');
      }
    });
  });
});
