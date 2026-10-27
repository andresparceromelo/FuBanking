/**
 * URLs del sistema bajo prueba. Por defecto apuntan al backend (:3001) y al
 * frontend (:3000) levantados en local; se pueden cambiar con variables de
 * entorno para correr contra otro ambiente.
 */
function withTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

export const environment = {
  apiUrl: withTrailingSlash(process.env.E2E_API_URL ?? 'http://localhost:3001/api/v1/'),
  webUrl: process.env.E2E_WEB_URL ?? 'http://localhost:3000',
  apiOnly: process.env.SERENITY_API_ONLY === 'true',
  headless: process.env.HEADLESS !== 'false',
  photosOfEveryInteraction: process.env.E2E_PHOTOS === 'all',
};

async function ping(name: string, url: string, hint: string): Promise<void> {
  try {
    const response = await fetch(url, { redirect: 'manual' });
    if (response.status >= 500) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    throw new Error(`${name} no responde en ${url} (${(error as Error).message}). ${hint}`);
  }
}

/** Falla rápido y con un mensaje claro si el sistema no está levantado. */
export async function ensureSystemIsUp(): Promise<void> {
  await ping('El backend', new URL('/health', environment.apiUrl).toString(), 'Levántalo con: npm --prefix backend run dev');
  if (!environment.apiOnly) {
    await ping('El frontend', new URL('/login', environment.webUrl).toString(), 'Levántalo con: npm --prefix frontend run dev');
  }
}
