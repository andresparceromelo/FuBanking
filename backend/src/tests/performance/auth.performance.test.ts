import { describe, it, expect } from 'vitest';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';

/**
 * Performance del firmado y verificacin de tokens (CPU-bound puro).
 * Patrn del ejemplo del profesor: presupuesto explcito + mediana de N repeticiones.
 * Al ser CI-friendly (sin backend vivo ni dependencias externas), corre en cada regresin.
 */
describe('Auth - JwtTokenService performance', () => {
  const payload = { userId: 'perf-user-123', email: 'testperf@example.com' };

  it('firma tokens dentro del presupuesto educativo (<150ms, mediana de 5)', () => {
    // Arrange
    const jwtService = new JwtTokenService();
    const durations: number[] = [];
    
    // Act
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      
      // Realizamos 1000 firmas por iteracin para tener una medicin ms robusta
      let lastToken = '';
      for (let j = 0; j < 1000; j++) {
        lastToken = jwtService.generate(payload);
      }
      
      durations.push(performance.now() - start);
      
      // Assert (correctitud bsica en cada repeticin)
      expect(lastToken).toBeTruthy();
      expect(typeof lastToken).toBe('string');
      expect(lastToken.split('.')).toHaveLength(3);
    }
    
    durations.sort((a, b) => a - b);
    const median = durations[Math.floor(durations.length / 2)]!;
    
    // Assert (presupuesto para 1000 firmas)
    expect(median).toBeLessThan(150);
  });

  it('verifica tokens dentro del presupuesto educativo (<150ms, mediana de 5)', () => {
    // Arrange
    const jwtService = new JwtTokenService();
    const token = jwtService.generate(payload);
    const durations: number[] = [];
    
    // Act
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      
      // Realizamos 1000 verificaciones por iteracin
      let lastDecoded: any;
      for (let j = 0; j < 1000; j++) {
        lastDecoded = jwtService.verify(token);
      }
      
      durations.push(performance.now() - start);
      
      // Assert (correctitud)
      expect(lastDecoded).toBeDefined();
      expect(lastDecoded.userId).toBe(payload.userId);
    }
    
    durations.sort((a, b) => a - b);
    const median = durations[Math.floor(durations.length / 2)]!;
    
    // Assert (presupuesto para 1000 verificaciones)
    expect(median).toBeLessThan(150);
  });
});
