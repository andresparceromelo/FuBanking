/**
 * Genera un número pseudoaleatorio en el rango [0, 1) usando el CSPRNG del
 * navegador (Web Crypto API) en lugar de `Math.random()`.
 *
 * Evita el hotspot de criptografía débil (SonarQube S2245) y da una
 * distribución uniforme adecuada incluso para usos no sensibles.
 */
export function secureRandom(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] / 2 ** 32;
}
