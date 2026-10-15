import { Ability } from './Ability';

/**
 * Habilidad para interactuar con la API REST del backend.
 *
 * Encapsula la URL base y los headers necesarios para realizar
 * peticiones HTTP contra los endpoints del backend.
 */
export class CallApi implements Ability {
  public readonly abilityName = 'CallApi';

  private authToken: string | null = null;

  private constructor(private readonly baseUrl: string) {}

  /** Crea una nueva instancia con la URL base de la API. */
  static at(baseUrl: string): CallApi {
    return new CallApi(baseUrl);
  }

  /** Extrae esta habilidad del actor que la posee. */
  static as(actor: { abilityTo: (abilityName: string) => Ability }): CallApi {
    return actor.abilityTo('CallApi') as CallApi;
  }

  /** Almacena el token JWT para peticiones autenticadas. */
  setToken(token: string): void {
    this.authToken = token;
  }

  /** Elimina el token JWT almacenado. */
  clearToken(): void {
    this.authToken = null;
  }

  /** Devuelve los headers base incluyendo el token si existe. */
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /** Construye la URL completa para un endpoint. */
  urlFor(endpoint: string): string {
    const cleanBase = this.baseUrl.replace(/\/+$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
  }

  /** Ejecuta una petición POST contra la API. */
  async post<T>(endpoint: string, body: Record<string, unknown>): Promise<{ status: number; data: T }> {
    const response = await fetch(this.urlFor(endpoint), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as T;
    return { status: response.status, data };
  }

  /** Ejecuta una petición GET contra la API. */
  async get<T>(endpoint: string): Promise<{ status: number; data: T }> {
    const response = await fetch(this.urlFor(endpoint), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = (await response.json()) as T;
    return { status: response.status, data };
  }

  /** Ejecuta una petición PATCH contra la API. */
  async patch<T>(endpoint: string, body: Record<string, unknown>): Promise<{ status: number; data: T }> {
    const response = await fetch(this.urlFor(endpoint), {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as T;
    return { status: response.status, data };
  }
}
