import { Ability } from './Ability';

/**
 * Habilidad para navegar e interactuar con la interfaz web del frontend.
 *
 * En un entorno E2E real se conectaría a un driver de navegador (Puppeteer,
 * Playwright, etc.). Esta implementación simula la navegación consultando
 * las URLs del frontend vía HTTP para validar respuestas del servidor.
 */
export class BrowseTheWeb implements Ability {
  public readonly abilityName = 'BrowseTheWeb';

  private cookies: Record<string, string> = {};

  private constructor(private readonly baseUrl: string) {}

  /** Crea una nueva instancia con la URL base del frontend. */
  static at(baseUrl: string): BrowseTheWeb {
    return new BrowseTheWeb(baseUrl);
  }

  /** Extrae esta habilidad del actor que la posee. */
  static as(actor: { abilityTo: (abilityName: string) => Ability }): BrowseTheWeb {
    return actor.abilityTo('BrowseTheWeb') as BrowseTheWeb;
  }

  /** Almacena una cookie (simula el comportamiento del navegador). */
  setCookie(name: string, value: string): void {
    this.cookies[name] = value;
  }

  /** Elimina una cookie específica. */
  clearCookie(name: string): void {
    delete this.cookies[name];
  }

  /** Elimina todas las cookies almacenadas. */
  clearAllCookies(): void {
    this.cookies = {};
  }

  /** Construye la URL completa para una ruta del frontend. */
  urlFor(path: string): string {
    const cleanBase = this.baseUrl.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  }

  /** Construye el header Cookie con todas las cookies almacenadas. */
  private buildCookieHeader(): string {
    return Object.entries(this.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  /**
   * Navega a una ruta del frontend y devuelve la respuesta HTTP.
   *
   * No sigue redirecciones automáticamente para poder verificar
   * el comportamiento del middleware de autenticación.
   */
  async navigateTo(path: string): Promise<{ status: number; headers: Headers; redirectUrl: string | null }> {
    const cookieHeader = this.buildCookieHeader();
    const headers: Record<string, string> = {};

    if (cookieHeader.length > 0) {
      headers['Cookie'] = cookieHeader;
    }

    const response = await fetch(this.urlFor(path), {
      method: 'GET',
      headers,
      redirect: 'manual',
    });

    const location = response.headers.get('location');

    return {
      status: response.status,
      headers: response.headers,
      redirectUrl: location,
    };
  }
}
