/**
 * Caso de Uso: Cierre de sesión.
 *
 * El logout es stateless con JWT: el token se elimina en el cliente (frontend).
 * En el backend este caso de uso sirve como punto de extensión para cuando
 * se implemente una blacklist de tokens o revocación explícita.
 *
 * Por ahora simplemente confirma que el usuario autenticado hizo la petición.
 */
export class LogoutUser {
  async execute(_userId: string): Promise<void> {
    // El frontend elimina el token de localStorage / cookies.
    // Aquí se puede agregar lógica de blacklist de tokens en el futuro.
    return;
  }
}
