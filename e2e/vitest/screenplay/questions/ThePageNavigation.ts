import { Actor } from '../actors/Actor';
import { Question } from './Question';
import { NavigateToLogin, NavigationResult } from '../tasks/NavigateToLogin';
import {
  NavigateToProtectedRoute,
  ProtectedNavigationResult,
} from '../tasks/NavigateToProtectedRoute';

/**
 * Pregunta: ¿Cuál fue el resultado de la última navegación al login?
 *
 * @example
 * ```ts
 * const nav = await actor.asks(ThePageNavigation.toLogin());
 * expect(nav.status).toBe(200);
 * ```
 */
export class ThePageNavigation implements Question<NavigationResult | ProtectedNavigationResult> {
  private constructor(private readonly type: 'login' | 'protected') {}

  /** Pregunta sobre la navegación a la página de login. */
  static toLogin(): ThePageNavigation {
    return new ThePageNavigation('login');
  }

  /** Pregunta sobre la navegación a una ruta protegida. */
  static toProtectedRoute(): ThePageNavigation {
    return new ThePageNavigation('protected');
  }

  async answeredBy(_actor: Actor): Promise<NavigationResult | ProtectedNavigationResult> {
    if (this.type === 'login') {
      const result = NavigateToLogin.lastResult;

      if (!result) {
        throw new Error(
          'No hay resultado de navegación al login disponible. ' +
            'Ejecuta NavigateToLogin antes de preguntar.',
        );
      }

      return result;
    }

    const result = NavigateToProtectedRoute.lastResult;

    if (!result) {
      throw new Error(
        'No hay resultado de navegación a ruta protegida. ' +
          'Ejecuta NavigateToProtectedRoute antes de preguntar.',
      );
    }

    return result;
  }
}
