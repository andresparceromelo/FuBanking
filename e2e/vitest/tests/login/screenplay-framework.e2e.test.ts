import { describe, it, expect, beforeEach } from 'vitest';
import { Actor } from '../../screenplay/actors/Actor';
import { CallApi } from '../../screenplay/abilities/CallApi';
import { BrowseTheWeb } from '../../screenplay/abilities/BrowseTheWeb';
import { LoginViaApi } from '../../screenplay/tasks/LoginViaApi';
import { TheLoginResult } from '../../screenplay/questions/TheLoginResult';

/**
 * Pruebas E2E — Validación del framework Screenplay
 *
 * Estas pruebas verifican que los componentes del patrón Screenplay
 * funcionan correctamente de forma aislada (sin servidores reales).
 * Cubren la mecánica del Actor, Abilities, Tasks y Questions.
 */
describe('Screenplay Framework — Validación de componentes', () => {
  describe('Actor', () => {
    it('debería crear un actor con nombre', () => {
      const actor = Actor.named('TestUser');

      expect(actor.getName()).toBe('TestUser');
    });

    it('debería registrar y recuperar habilidades', () => {
      const api = CallApi.at('http://localhost:3001/api/v1');
      const actor = Actor.named('TestUser').whoCan(api);

      const recovered = actor.abilityTo('CallApi');

      expect(recovered).toBe(api);
    });

    it('debería lanzar error al solicitar una habilidad inexistente', () => {
      const actor = Actor.named('TestUser');

      expect(() => actor.abilityTo('Inexistente')).toThrow(
        'El actor "TestUser" no tiene la habilidad "Inexistente"',
      );
    });

    it('debería soportar múltiples habilidades encadenadas', () => {
      const api = CallApi.at('http://localhost:3001/api/v1');
      const browser = BrowseTheWeb.at('http://localhost:3000');
      const actor = Actor.named('TestUser').whoCan(api).whoCan(browser);

      expect(actor.abilityTo('CallApi')).toBe(api);
      expect(actor.abilityTo('BrowseTheWeb')).toBe(browser);
    });
  });

  describe('CallApi', () => {
    it('debería construir URLs correctamente', () => {
      const api = CallApi.at('http://localhost:3001/api/v1');

      expect(api.urlFor('/auth/login')).toBe('http://localhost:3001/api/v1/auth/login');
      expect(api.urlFor('auth/login')).toBe('http://localhost:3001/api/v1/auth/login');
    });

    it('debería generar headers sin token por defecto', () => {
      const api = CallApi.at('http://localhost:3001/api/v1');
      const headers = api.getHeaders();

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Authorization']).toBeUndefined();
    });

    it('debería incluir el token en los headers cuando se configura', () => {
      const api = CallApi.at('http://localhost:3001/api/v1');
      api.setToken('jwt-test-token');
      const headers = api.getHeaders();

      expect(headers['Authorization']).toBe('Bearer jwt-test-token');
    });

    it('debería limpiar el token correctamente', () => {
      const api = CallApi.at('http://localhost:3001/api/v1');
      api.setToken('jwt-test-token');
      api.clearToken();
      const headers = api.getHeaders();

      expect(headers['Authorization']).toBeUndefined();
    });

    it('debería extraerse correctamente desde un actor', () => {
      const api = CallApi.at('http://localhost:3001/api/v1');
      const actor = Actor.named('TestUser').whoCan(api);

      const extracted = CallApi.as(actor);

      expect(extracted).toBe(api);
    });
  });

  describe('BrowseTheWeb', () => {
    it('debería construir URLs correctamente', () => {
      const browser = BrowseTheWeb.at('http://localhost:3000');

      expect(browser.urlFor('/login')).toBe('http://localhost:3000/login');
      expect(browser.urlFor('login')).toBe('http://localhost:3000/login');
    });

    it('debería gestionar cookies correctamente', () => {
      const browser = BrowseTheWeb.at('http://localhost:3000');

      browser.setCookie('token', 'abc123');
      browser.setCookie('session', 'xyz789');

      browser.clearCookie('session');

      browser.clearAllCookies();
    });

    it('debería extraerse correctamente desde un actor', () => {
      const browser = BrowseTheWeb.at('http://localhost:3000');
      const actor = Actor.named('TestUser').whoCan(browser);

      const extracted = BrowseTheWeb.as(actor);

      expect(extracted).toBe(browser);
    });
  });

  describe('TheLoginResult', () => {
    beforeEach(() => {
      LoginViaApi.lastResult = null;
    });

    it('debería lanzar error cuando no hay resultado previo', async () => {
      const actor = Actor.named('TestUser')
        .whoCan(CallApi.at('http://localhost:3001/api/v1'));

      await expect(actor.asks(TheLoginResult.fromLastAttempt())).rejects.toThrow(
        'No hay resultado de login disponible',
      );
    });

    it('debería devolver el resultado cuando existe', async () => {
      const actor = Actor.named('TestUser')
        .whoCan(CallApi.at('http://localhost:3001/api/v1'));

      LoginViaApi.lastResult = {
        status: 200,
        data: {
          requiresTwoFactor: false,
          user: { id: 'u1', email: 'test@example.com' },
          token: 'jwt',
        },
      };

      const result = await actor.asks(TheLoginResult.fromLastAttempt());

      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('token', 'jwt');
    });
  });
});
