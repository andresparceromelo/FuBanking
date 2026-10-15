import { Actor } from '../actors/Actor';
import { Task } from './Task';
import { BrowseTheWeb } from '../abilities/BrowseTheWeb';

/** Resultado almacenado tras navegar a una ruta protegida. */
export interface ProtectedNavigationResult {
  status: number;
  redirectUrl: string | null;
  path: string;
}

/**
 * Tarea: Navegar a una ruta protegida del dashboard.
 *
 * El actor usa su habilidad `BrowseTheWeb` para intentar acceder
 * a una ruta protegida. El middleware del frontend debería redirigir
 * al login si no hay token.
 *
 * @example
 * ```ts
 * await actor.attemptsTo(NavigateToProtectedRoute.at('/profile'));
 * ```
 */
export class NavigateToProtectedRoute implements Task {
  /** Almacena el último resultado de navegación protegida. */
  static lastResult: ProtectedNavigationResult | null = null;

  private constructor(private readonly path: string) {}

  /** Crea la tarea para la ruta protegida especificada. */
  static at(path: string): NavigateToProtectedRoute {
    return new NavigateToProtectedRoute(path);
  }

  async performAs(actor: Actor): Promise<void> {
    const browser = BrowseTheWeb.as(actor);

    const response = await browser.navigateTo(this.path);

    NavigateToProtectedRoute.lastResult = {
      status: response.status,
      redirectUrl: response.redirectUrl,
      path: this.path,
    };
  }
}
