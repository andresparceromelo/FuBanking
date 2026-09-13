import { performance } from 'perf_hooks';
import { LoginUser } from './src/application/use-cases/auth/LoginUser';
import { User } from './src/domain/entities/User';
import { Email } from './src/domain/value-objects/Email';
import { Document } from './src/domain/value-objects/Document';
import { InMemoryUserRepository } from './src/__tests__/fakes/InMemoryUserRepository';
import { InMemoryVerificationCodeRepository } from './src/__tests__/fakes/InMemoryVerificationCodeRepository';
import { FakePasswordService } from './src/__tests__/fakes/FakePasswordService';
import { FakeTokenService } from './src/__tests__/fakes/FakeTokenService';
import { FakeEmailService } from './src/__tests__/fakes/FakeEmailService';

async function runPerformanceTest() {
  console.log('Iniciando prueba de rendimiento para LoginUser (Sin 2FA)...\n');

  // 1. Preparar las dependencias (fakes)
  const userRepository = new InMemoryUserRepository();
  const verificationCodeRepository = new InMemoryVerificationCodeRepository();
  const passwordService = new FakePasswordService();
  const tokenService = new FakeTokenService();
  const emailService = new FakeEmailService();

  const loginUser = new LoginUser(
    userRepository,
    passwordService,
    tokenService,
    verificationCodeRepository,
    emailService
  );

  // 2. Crear un usuario de prueba activo
  const user = new User({
    id: 'user-001',
    email: new Email('ana@mail.com'),
    document: new Document('1234567890'),
    firstName: 'Ana',
    middleName: null,
    lastName: 'Gómez',
    secondLastName: null,
    birthDate: new Date('1995-03-10'),
    phone: null,
    avatarUrl: null,
    passwordHash: 'hashed_abc123',
    isActive: true,
    twoFactorEnabled: false,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  userRepository.seed(user);

  const dto = { email: 'ana@mail.com', password: 'abc123', rememberMe: false };
  let tiempos: number[] = [];

  // 3. Ejecutar la función 5 veces y medir el tiempo
  for (let i = 1; i <= 5; i++) {
    const tiempoInicio = performance.now();
    
    await loginUser.execute(dto);
    
    const tiempoFinalizacion = performance.now();
    const tiempoDeRespuesta = tiempoFinalizacion - tiempoInicio;
    
    tiempos.push(tiempoDeRespuesta);
    console.log(`Intento ${i}: Inicio (0 ms) - Fin (${tiempoDeRespuesta.toFixed(4)} ms) -> Tiempo de respuesta: ${tiempoDeRespuesta.toFixed(4)} ms`);
  }

  // 4. Calcular el promedio
  const promedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
  console.log(`\nPromedio total: ${promedio.toFixed(4)} ms`);
}

runPerformanceTest().catch(console.error);
