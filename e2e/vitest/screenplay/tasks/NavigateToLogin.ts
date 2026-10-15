import { Actor } from '../actors/Actor';
import { Task } from './Task';
import { BrowseTheWeb } from '../abilities/BrowseTheWeb';

/** Resultado almacenado tras la navegación al login. */
export interface NavigationResult {
  status: number;
  redirectUrl: string | null;
}

/**
 * Tarea: Navegar a la página de login del frontend.
 *
 * El actor usa su habilidad `BrowseTheWeb` para navegar a `/login`
 * y almacena el resultado de la respuesta HTTP.
 *
 * @example
 * ```ts
 * await actor.attemptsTo(NavigateToLogin.page());
 * ```
 */
export class NavigateToLogin implements Task {
  /** Almacena el último resultado de navegación. */
  static lastResult: NavigationResult | null = null;

  private constructor() {}

  /** Crea una instancia de la tarea. */
  static page(): NavigateToLogin {
    return new NavigateToLogin();
  }

  async performAs(actor: Actor): Promise<void> {
    const browser = BrowseTheWeb.as(actor);

    const response = await browser.navigateTo('/login');

    NavigateToLogin.lastResult = {
      status: response.status,
      redirectUrl: response.redirectUrl,
    };
  }
}
