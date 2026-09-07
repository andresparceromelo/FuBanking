# Prompt: Generación de pruebas unitarias — Login con 2FA (FuBanking)

## Contexto del proyecto

Estoy haciendo **pruebas de caja blanca** para la funcionalidad de **inicio de sesión con autenticación de dos factores (2FA)** del proyecto `FuBanking`. Ya construí para esta funcionalidad, en tres capas (Backend, Frontend, Integración), un diagrama de flujo, un diagrama de nodos (grafo) y una **tabla de caminos** (basis paths, método de McCabe) para cada capa.

Tu tarea es **generar las pruebas unitarias/de integración correspondientes a cada camino de cada tabla**, una prueba por camino, usando el código fuente real que te doy abajo.

Stack del proyecto:
- Backend: Node.js + TypeScript, arquitectura por casos de uso (Clean Architecture), Jest.
- Frontend: React + TypeScript, formularios con react-hook-form, Jest + React Testing Library.
- Integración: Jest + Supertest (backend) y/o React Testing Library + MSW (mock de la API) para el frontend.

---

## 1. Código fuente relevante (Backend)

### Rutas
`backend/src/presentation/routes/auth.routes.ts`
```typescript
router.post('/login', controller.login);
router.post('/2fa/verify', twoFactorController.verify);
router.post('/2fa/resend', twoFactorController.resend);
```

### Controlador 2FA
`backend/src/presentation/controllers/TwoFactorController.ts`
```typescript
verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dto = verifyTwoFactorSchema.parse(req.body);
    const result = await this.verifyTwoFactorUseCase.execute(dto);
    sendSuccess(res, result, 'Verificación exitosa. Bienvenido.');
  } catch (error) {
    next(error);
  }
};
```

### Caso de uso: LoginUser (Paso 1)
`backend/src/application/use-cases/auth/LoginUser.ts`
```typescript
// 4a. Sin 2FA: generar JWT directamente
if (!user.twoFactorEnabled) {
  /* ... (se genera y retorna el token definitivo) */
}

// 4b. Con 2FA: generar OTP y enviar al correo
const { temporaryToken, maskedEmail } = await this.generateTwoFactorCode.execute(
  user.id,
  user.email.toString(),
);

return {
  requiresTwoFactor: true,
  temporaryToken,
  maskedEmail,
};
```

### Caso de uso: VerifyTwoFactorCode (Paso 2)
`backend/src/application/use-cases/auth/VerifyTwoFactorCode.ts`
```typescript
// 2. Buscar el código de verificación más reciente
const verificationCode = await this.verificationCodeRepository.findLatestByUserId(payload.userId);

// 3. (Validaciones de usado, expirado, límite de intentos)

// 4. Comparar código ingresado con el hash almacenado
const isCodeValid = await this.passwordService.compare(dto.code, verificationCode.codeHash);

if (!isCodeValid) {
  verificationCode.incrementAttempts();
  await this.verificationCodeRepository.update(verificationCode);
  throw new AuthError(`Código incorrecto...`, 'INVALID_OTP');
}

// 5. Código correcto: marcar como usado
verificationCode.markAsUsed();
await this.verificationCodeRepository.update(verificationCode);

// 7. Generar JWT definitivo
const token = this.tokenService.generate({ userId: user.id, email: user.email.toString() }, tokenOptions);
```

> Nota: los fragmentos de validaciones "usado", "expirado" y "límite de intentos" (líneas 78-88 aprox.) no están completos en el documento original, pero según los comentarios y el flujo, lanzan `OTP_ALREADY_USED`, error de expiración, y `MAX_ATTEMPTS_REACHED` respectivamente, cada uno antes de la comparación de hash.

---

## 2. Código fuente relevante (Frontend)

### LoginForm
`frontend/src/features/auth/components/LoginForm.tsx`
```tsx
const onSubmit = (data: LoginInput) => {
  handleLogin(data); // El enrutamiento y guardado del token se maneja dentro del hook
};
```

### TwoFactorVerifyForm
`frontend/src/features/auth/components/TwoFactorVerifyForm.tsx`
```tsx
const handleChange = (index: number, value: string) => {
  if (!/^\d*$/.test(value)) return; // Only allow digits

  const newCode = [...code];
  newCode[index] = value;
  setCode(newCode);

  if (value && index < 5) {
    inputRefs.current[index + 1]?.focus();
  }

  if (value && index === 5 && newCode.every(v => v !== '')) {
    handleVerify(newCode.join(''));
  }
};
```

### Servicio HTTP (capa de integración)
`frontend/src/features/auth/services/auth.service.ts`
```typescript
async verifyTwoFactor(temporaryToken: string, code: string): Promise<TwoFactorVerifyResponse> {
  const response = await apiClient.post<TwoFactorVerifyResponse>('/auth/2fa/verify', {
    temporaryToken,
    code,
  });
  return response.data;
}

async resendTwoFactorCode(temporaryToken: string): Promise<TwoFactorResendResponse> {
  const response = await apiClient.post<TwoFactorResendResponse>('/auth/2fa/resend', {
    temporaryToken,
  });
  return response.data;
}
```

---

## 3. Tabla de caminos — BACKEND

Nodos clave: 1=Inicio POST /login, 3=D¿Usuario existe?, 5=D¿Contraseña correcta?, 6=D¿2FA habilitado?, 12=D¿Token válido?, 15=D¿Código encontrado?, 17=D¿Código ya usado?, 19=D¿Código expirado?, 21=D¿Intentos≥máximo?, 23=D¿Código correcto?

| Camino | Entrada | Prueba | Salida |
|---|---|---|---|
| C1 | Final=1, Campo1=0 (usuario y password correctos, twoFactorEnabled=false) | usuarioExiste=true, passwordCorrecta=true, twoFactorEnabled=false | Genera JWT, retorna `{ token }` — login exitoso sin 2FA |
| C2 | usuarioExiste=true, passwordCorrecta=true, twoFactorEnabled=true, tokenValido=true, codigoEncontrado=true, codigoUsado=false, codigoExpirado=false, intentos<max, codigoCorrecto=true | (mismos valores) | Genera OTP, envía correo, marca código usado, genera JWT — login exitoso con 2FA |
| C3 | usuarioExiste=false | usuarioExiste=false | Retorna error 401 "Credenciales inválidas" |
| C4 | usuarioExiste=true, passwordCorrecta=false | passwordCorrecta=false | Retorna error 401 "Credenciales inválidas" |
| C5 | twoFactorEnabled=true, tokenValido=false | tokenValido=false | Retorna error "Token inválido" |
| C6 | tokenValido=true, codigoEncontrado=false | codigoEncontrado=false | Retorna error "Código no encontrado" |
| C7 | codigoEncontrado=true, codigoUsado=true | codigoUsado=true | Retorna error `OTP_ALREADY_USED` |
| C8 | codigoUsado=false, codigoExpirado=true | codigoExpirado=true | Retorna error "Código expirado" |
| C9 | codigoExpirado=false, intentos≥max | intentos≥max | Retorna error `MAX_ATTEMPTS_REACHED` |
| C10 | intentos<max, codigoCorrecto=false | codigoCorrecto=false | Incrementa intentos, retorna error `INVALID_OTP` |

---

## 4. Tabla de caminos — FRONTEND (simplificado, opción A: sin diferenciar dígito/pegado)

Nodos clave: 3=D¿Formulario válido?, 6=D¿requiresTwoFactor?, 7=D¿Login exitoso?, 13=D¿Código ingresado es válido? (6 dígitos), 16=D¿Verificación exitosa?

| Camino | Entrada | Prueba | Salida |
|---|---|---|---|
| C1 | formularioValido=true, requiresTwoFactor=false, loginExitoso=true | (mismos valores) | Guarda JWT, redirige a Dashboard — login sin 2FA |
| C2 | formularioValido=false | formularioValido=false | Muestra errores de validación en el formulario |
| C3 | requiresTwoFactor=false, loginExitoso=false | (mismos valores) | Muestra error "Credenciales inválidas" |
| C4 | requiresTwoFactor=true, codigoValido=false | codigoValido=false | Ignora la entrada inválida (no dispara verificación) |
| C5 | codigoValido=true, verificacionExitosa=true | (mismos valores) | Ejecuta handleVerify(), guarda JWT, redirige a Dashboard |
| C6 | codigoValido=true, verificacionExitosa=false | (mismos valores) | Ejecuta handleVerify(), muestra error, limpia campos |

---

## 5. Tabla de caminos — INTEGRACIÓN (Frontend ↔ Backend, flujo completo)

Nodos clave (numeración del diagrama de integración completo): 4=¿Usuario existe?, 6=¿Contraseña correcta?, 7=¿2FA habilitado?, 12=¿requiresTwoFactor?, 13=¿Login exitoso?, 20=¿Token válido?, 23=¿Código encontrado?, 25=¿Código ya usado?, 27=¿Código expirado?, 29=¿Intentos≥máximo?, 31=¿Código correcto?, 35=¿Respuesta exitosa (200)?

| # | Camino (resumen) | Entrada | Prueba | Salida |
|---|---|---|---|---|
| C1 | Usuario no existe | usuarioExiste=false | usuarioExiste=false | POST /login → 401 "Credenciales inválidas" → reintento en UI |
| C2 | Password incorrecta | usuarioExiste=true, passwordCorrecta=false | (mismos valores) | POST /login → 401 "Credenciales inválidas" → reintento en UI |
| C3 | Login exitoso sin 2FA | passwordCorrecta=true, twoFactorEnabled=false | requiresTwoFactor=false, loginExitoso=true | POST /login → 200 `{ token }` → Dashboard |
| C4 | Token temporal inválido | twoFactorEnabled=true, tokenValido=false | requiresTwoFactor=true | POST /login → 200 (requiresTwoFactor) → POST /2fa/verify → 401 "Token inválido" → reintento |
| C5 | Código no encontrado | tokenValido=true, codigoEncontrado=false | (mismos valores) | POST /2fa/verify → 404 "Código no encontrado" → reintento |
| C6 | Código ya usado | codigoEncontrado=true, codigoUsado=true | (mismos valores) | POST /2fa/verify → 401 `OTP_ALREADY_USED` → reintento |
| C7 | Código expirado | codigoUsado=false, codigoExpirado=true | (mismos valores) | POST /2fa/verify → 401 "Código expirado" → reintento |
| C8 | Intentos máximos alcanzados | codigoExpirado=false, intentos≥max | (mismos valores) | POST /2fa/verify → 429 `MAX_ATTEMPTS_REACHED` → reintento |
| C9 | Código incorrecto (OTP inválido) | intentos<max, codigoCorrecto=false | (mismos valores) | POST /2fa/verify → 401 `INVALID_OTP` → reintento |
| C10 | Login exitoso con 2FA | codigoCorrecto=true | respuestaExitosa=200 | POST /2fa/verify → 200 `{ token }` → Dashboard |

---

## 6. Lo que necesito que generes

Para **cada camino de cada una de las tres tablas** (26 pruebas en total: 10 backend + 6 frontend + 10 integración), genera **una prueba independiente** que:

1. **Nombre la prueba con el identificador del camino** (ej. `C1`, `C2`...) y una descripción corta del escenario, para poder trazarla de vuelta a la tabla y al diagrama (ej. `test('C4 - retorna error si el token temporal es inválido', ...)`).
2. **Configure la entrada** (mocks de repositorios, servicios, `request.body`, props/estado de componentes, respuestas mockeadas de la API) según la columna "Entrada" de la tabla.
3. **Ejecute** la unidad de código correspondiente (caso de uso, controlador, componente, o el flujo completo end-to-end según la capa).
4. **Verifique explícitamente** las condiciones de la columna "Prueba" (con `expect(...)` sobre el estado intermedio si aplica).
5. **Asegure la salida** de la columna "Salida" (valor de retorno, código de estado HTTP, texto mostrado en UI, redirección, llamada a función mockeada, etc.).

Reglas adicionales:
- **Backend:** usa Jest con mocks de `verificationCodeRepository`, `userRepository`, `passwordService` y `tokenService` (jest.fn() / jest.mock()). Agrupa por caso de uso (`LoginUser.test.ts`, `VerifyTwoFactorCode.test.ts`).
- **Frontend:** usa React Testing Library. Mockea el hook `useLogin` y el servicio `auth.service.ts`. Agrupa por componente (`LoginForm.test.tsx`, `TwoFactorVerifyForm.test.tsx`).
- **Integración:** usa Supertest contra la app Express con base de datos/repositorios en memoria o mockeados a nivel de infraestructura (no mockees los casos de uso), o usa MSW en el frontend para interceptar las llamadas reales a `/auth/login` y `/auth/2fa/verify`.
- Si algún dato de la tabla no es suficiente para escribir la prueba (p. ej. no tengo el mensaje de error exacto o el código HTTP exacto), indícalo explícitamente con un comentario `// TODO: confirmar con Melo` en vez de inventarlo.
- No agregues pruebas para caminos que no estén en las tablas.
- Entrega el código organizado por archivo (uno por tabla/capa como mínimo), listo para pegar en el proyecto.
