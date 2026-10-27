/**
 * VerifyTwoFactorCode — Pruebas con Mocks (vi.fn)
 *
 * Equivalente mock-based de VerifyTwoFactorCode.test.ts.
 * Las dependencias se construyen con mockFactories para evitar duplicación
 * y cumplir con el Quality Gate de SonarCloud (duplicación ≤ 3%).
 *
 * Cubre:
 *   C5  — temporaryToken inválido → TOKEN_INVALID
 *   C6  — código no encontrado → INVALID_OTP
 *   C7  — código ya usado → OTP_ALREADY_USED
 *   C8  — código expirado → OTP_EXPIRED
 *   C9  — intentos >= máximo (1) → MAX_ATTEMPTS_REACHED
 *   C10 — código incorrecto al 1er intento → invalida y lanza MAX_ATTEMPTS_REACHED
 *   C2  — código correcto → marca usado, genera JWT, retorna user+token
 *   C11 — rememberMe=true en temporaryToken → expiresIn '30d'
 *   C12 — rememberMe=false en temporaryToken → expiresIn '7d'
 *   C13 — rememberMe ausente en temporaryToken → expiresIn '7d'
 *
 * Ejecutar: npx vitest run src/tests/auth/mocks/VerifyTwoFactorCode.mock.test.ts
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { expect as assert } from '@assertive-ts/core';
import { VerifyTwoFactorCode } from '../../../application/use-cases/auth/VerifyTwoFactorCode';
import { VerificationCode } from '../../../domain/entities/VerificationCode';
import {
  buildTwoFactorUser,
  buildVerificationCode,
  makeUserRepositoryMock,
  makeVerificationCodeRepositoryMock,
  makePasswordServiceMock,
  makeTokenServiceMock,
} from './mockFactories';

// ─── Suite ─────────────────────────────────────────────────────────────────

describe('VerifyTwoFactorCode — Pruebas con Mocks (vi.fn)', () => {
  let mocks: {
    verificationCodeRepository: ReturnType<typeof makeVerificationCodeRepositoryMock>;
    userRepository: ReturnType<typeof makeUserRepositoryMock>;
    passwordService: ReturnType<typeof makePasswordServiceMock>;
    tokenService: ReturnType<typeof makeTokenServiceMock>;
  };
  let verifyTwoFactor: VerifyTwoFactorCode;
  let validTempToken: string;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = {
      verificationCodeRepository: makeVerificationCodeRepositoryMock(),
      userRepository: makeUserRepositoryMock(),
      passwordService: makePasswordServiceMock(),
      tokenService: makeTokenServiceMock(),
    };
    verifyTwoFactor = new VerifyTwoFactorCode(
      mocks.verificationCodeRepository,
      mocks.userRepository,
      mocks.passwordService,
      mocks.tokenService,
    );
    validTempToken = mocks.tokenService.generate({ userId: 'user-123', email: 'juan@example.com' });
  });

  // ── Helpers locales ──────────────────────────────────────────────────────

  /** Configura los mocks para el camino feliz (código correcto, usuario encontrado). */
  function setupHappyPath(code: VerificationCode): void {
    vi.mocked(mocks.verificationCodeRepository.findLatestByUserId).mockResolvedValue(code);
    vi.mocked(mocks.passwordService.compare).mockResolvedValue(true);
    vi.mocked(mocks.verificationCodeRepository.update).mockResolvedValue();
    vi.mocked(mocks.userRepository.findById).mockResolvedValue(buildTwoFactorUser());
  }

  // ── C5 ──────────────────────────────────────────────────────────────────
  it('C5 - token temporal inválido: lanza error TOKEN_INVALID', async () => {
    await expect(
      verifyTwoFactor.execute({ temporaryToken: 'invalid.token.for.testing', code: '123456' }),
    ).rejects.toMatchObject({ code: 'TOKEN_INVALID' });

    expect(mocks.verificationCodeRepository.findLatestByUserId).not.toHaveBeenCalled();
  });

  // ── C6 ──────────────────────────────────────────────────────────────────
  it('C6 - código de verificación no encontrado: lanza error INVALID_OTP', async () => {
    vi.mocked(mocks.verificationCodeRepository.findLatestByUserId).mockResolvedValue(null);

    await expect(
      verifyTwoFactor.execute({ temporaryToken: validTempToken, code: '654321' }),
    ).rejects.toMatchObject({ code: 'INVALID_OTP' });
  });

  // ── C7 ──────────────────────────────────────────────────────────────────
  it('C7 - código ya utilizado: lanza error OTP_ALREADY_USED', async () => {
    vi.mocked(mocks.verificationCodeRepository.findLatestByUserId).mockResolvedValue(
      buildVerificationCode({ used: true }),
    );

    await expect(
      verifyTwoFactor.execute({ temporaryToken: validTempToken, code: '111111' }),
    ).rejects.toMatchObject({ code: 'OTP_ALREADY_USED' });
  });

  // ── C8 ──────────────────────────────────────────────────────────────────
  it('C8 - código expirado: lanza error OTP_EXPIRED', async () => {
    vi.mocked(mocks.verificationCodeRepository.findLatestByUserId).mockResolvedValue(
      buildVerificationCode({ used: false, expiresAt: new Date(Date.now() - 1) }),
    );

    await expect(
      verifyTwoFactor.execute({ temporaryToken: validTempToken, code: '222222' }),
    ).rejects.toMatchObject({ code: 'OTP_EXPIRED' });
  });

  // ── C9 ──────────────────────────────────────────────────────────────────
  it('C9 - intentos >= máximo (1): lanza error MAX_ATTEMPTS_REACHED', async () => {
    vi.mocked(mocks.verificationCodeRepository.findLatestByUserId).mockResolvedValue(
      buildVerificationCode({ used: false, attempts: 1 }),
    );

    await expect(
      verifyTwoFactor.execute({ temporaryToken: validTempToken, code: '333333' }),
    ).rejects.toMatchObject({ code: 'MAX_ATTEMPTS_REACHED' });
  });

  // ── C10 ─────────────────────────────────────────────────────────────────
  it('C10 - código incorrecto al primer intento: anula el código y lanza MAX_ATTEMPTS_REACHED', async () => {
    vi.mocked(mocks.verificationCodeRepository.findLatestByUserId).mockResolvedValue(
      buildVerificationCode({ used: false, attempts: 0 }),
    );
    vi.mocked(mocks.passwordService.compare).mockResolvedValue(false);
    vi.mocked(mocks.verificationCodeRepository.update).mockResolvedValue();

    await expect(
      verifyTwoFactor.execute({ temporaryToken: validTempToken, code: '444444' }),
    ).rejects.toMatchObject({ code: 'MAX_ATTEMPTS_REACHED' });

    expect(mocks.verificationCodeRepository.update).toHaveBeenCalledTimes(1);
    const updatedCode = vi.mocked(mocks.verificationCodeRepository.update).mock.calls[0]?.[0];
    assert(updatedCode?.attempts).toBeEqual(1);
    assert(updatedCode?.isUsed()).toBeTrue();
  });

  // ── C2 ──────────────────────────────────────────────────────────────────
  it('C2 - código correcto: marca como usado, genera JWT definitivo y retorna user+token', async () => {
    setupHappyPath(buildVerificationCode({ used: false, attempts: 0 }));

    const result = await verifyTwoFactor.execute({ temporaryToken: validTempToken, code: '123456' });

    expect(mocks.verificationCodeRepository.update).toHaveBeenCalledTimes(1);
    const updatedCode = vi.mocked(mocks.verificationCodeRepository.update).mock.calls[0]?.[0];
    assert(updatedCode?.isUsed()).toBeTrue();

    assert(result.token).toBePresent();
    const payload = mocks.tokenService.verify(result.token);
    assert(payload['userId']).toBeEqual('user-123');
    assert(payload['email']).toBeEqual('juan@example.com');
    assert(result.user).toBePresent();
    assert(result.user.id).toBeEqual('user-123');
    expect(mocks.userRepository.findById).toHaveBeenCalledWith('user-123');
  });

  // ── C11 — rememberMe=true ────────────────────────────────────────────────
  it('C11 - rememberMe=true en el temporaryToken: el JWT definitivo usa expiración 30d', async () => {
    const tokenWithRemember = mocks.tokenService.generate({
      userId: 'user-123',
      email: 'juan@example.com',
      rememberMe: true,
    });
    setupHappyPath(buildVerificationCode({ used: false, attempts: 0 }));

    const result = await verifyTwoFactor.execute({ temporaryToken: tokenWithRemember, code: '123456' });

    assert(result.token).toBePresent();
    expect(mocks.tokenService.generate).toHaveBeenLastCalledWith(
      expect.objectContaining({ userId: 'user-123' }),
      expect.objectContaining({ expiresIn: '30d' }),
    );
  });

  // ── C12 — rememberMe=false ───────────────────────────────────────────────
  it('C12 - rememberMe=false en el temporaryToken: el JWT definitivo usa expiración 7d', async () => {
    const tokenNoRemember = mocks.tokenService.generate({
      userId: 'user-123',
      email: 'juan@example.com',
      rememberMe: false,
    });
    setupHappyPath(buildVerificationCode({ used: false, attempts: 0 }));

    const result = await verifyTwoFactor.execute({ temporaryToken: tokenNoRemember, code: '123456' });

    assert(result.token).toBePresent();
    expect(mocks.tokenService.generate).toHaveBeenLastCalledWith(
      expect.objectContaining({ userId: 'user-123' }),
      expect.objectContaining({ expiresIn: '7d' }),
    );
  });

  // ── C13 — rememberMe ausente ─────────────────────────────────────────────
  it('C13 - rememberMe ausente en el temporaryToken: el JWT definitivo usa expiración 7d', async () => {
    const tokenNoField = mocks.tokenService.generate({ userId: 'user-123', email: 'juan@example.com' });
    setupHappyPath(buildVerificationCode({ used: false, attempts: 0 }));

    const result = await verifyTwoFactor.execute({ temporaryToken: tokenNoField, code: '123456' });

    assert(result.token).toBePresent();
    expect(mocks.tokenService.generate).toHaveBeenLastCalledWith(
      expect.objectContaining({ userId: 'user-123' }),
      expect.objectContaining({ expiresIn: '7d' }),
    );
  });
});
