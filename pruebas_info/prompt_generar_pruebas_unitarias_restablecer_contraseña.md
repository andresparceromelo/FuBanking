# Prompt: Generar pruebas unitarias a partir de tablas de caminos — Recuperar/Restablecer Contraseña (FuBanking)

## Rol

Eres un ingeniero de QA/testing experto en TypeScript, Node.js/Express y React. Tu tarea es generar **pruebas unitarias de caja blanca** a partir de las tablas de caminos (basis path testing / McCabe) que te entrego a continuación, una por cada capa: **Backend**, **Frontend** e **Integración**.

Cada tabla de caminos fue derivada de un grafo de flujo construido directamente sobre el código fuente real del proyecto. Cada "Camino" (Ci) representa una ruta linealmente independiente del grafo y debe convertirse en **exactamente un test** (o el mínimo de tests necesarios si el camino requiere varias aserciones).

## Instrucciones generales

1. Genera un archivo de test por cada sección (backend, frontend, integración), o los archivos que consideres adecuados según la convención del proyecto (`*.test.ts`, `*.spec.ts`, `*.test.tsx`).
2. Usa **Jest** como framework base. Para backend usa `ts-jest`; para frontend usa **React Testing Library** + `@testing-library/user-event`; para integración usa **Supertest** contra la app de Express (o indícame si prefieres Cypress/Playwright, en cuyo caso adáptalo).
3. Sigue la estructura **AAA (Arrange-Act-Assert)** en cada test.
4. Nombra cada test referenciando el camino que cubre, por ejemplo: `it('C2 — usuario existe pero las contraseñas no coinciden → PASSWORDS_DONT_MATCH', ...)`.
5. Indica explícitamente qué debe mockearse (repositorios, `tokenService`, `emailService`, `apiClient`/Axios, `fetch`, etc.) y con qué valores de retorno, para que cada test aísle exactamente la rama del camino que prueba.
6. Si un camino depende de un nodo marcado como **"inferido"** (no visible directamente en el fragmento de código compartido), señala esa suposición en un comentario dentro del test, para que yo la valide contra el código real antes de correrlo.
7. No omitas ningún camino de las tablas: el conjunto de tests debe alcanzar cobertura de complejidad ciclomática completa (V(G) tests por sección).

---

## 1. BACKEND — `RequestPasswordReset` + `ResetPassword` (flujo unificado)

### Código de referencia

```typescript
// backend/src/application/use-cases/auth/RequestPasswordReset.ts
const user = await this.userRepository.findByEmail(email);
if (!user) {
  console.log('[RequestPasswordReset] Usuario NO encontrado en la BD. Abortando.');
  return;
}
const token = this.tokenService.generate(
  { userId: user.id, email: user.email.toString(), type: 'reset' },
  { expiresIn: '15m' }
);
const resetLink = `${process.env['CLIENT_URL']}/reset-password?token=${token}`;
await this.emailService.sendPasswordResetEmail(user.email.toString(), resetLink);
```

```typescript
// backend/src/application/use-cases/auth/ResetPassword.ts
// 1. Validar contraseñas
if (dto.newPassword !== dto.confirmPassword) {
  throw new AppError('Las contraseñas no coinciden', 400, 'PASSWORDS_DONT_MATCH');
}
// 2. Verificar el token JWT
let payload;
try {
  payload = this.tokenService.verify(dto.token);
} catch (error) {
  throw new AuthError('El enlace de recuperación es inválido o ha expirado', 'TOKEN_INVALID');
}
// 3. (inferido) Verificar que payload.type === 'reset' → TOKEN_INVALID si no
// 4. Hashear nueva contraseña
const newPasswordHash = await this.passwordService.hash(dto.newPassword);
// 5. Actualizar hash en nuestra tabla de usuarios usando el repositorio
await this.userRepository.updatePassword(user.id, newPasswordHash);
```

### Leyenda de nodos (1-18)

| Nodo | Tipo | Descripción |
|---|---|---|
| 1 | Inicio | Se recibe la solicitud con el email (`POST /forgot-password`). |
| 2 | Proceso | `userRepository.findByEmail(email)`. |
| 3 | Decisión | ¿El usuario existe? |
| 4 | Fin (rama alterna) | No existe; retorna sin enviar correo (responde 200 igual). |
| 5 | Proceso | Genera token JWT tipo `reset`, expira en 15 min. |
| 6 | Proceso | Construye `resetLink` (`CLIENT_URL` + token). |
| 7 | Proceso | `emailService.sendPasswordResetEmail()`. |
| 8 | Proceso (transición) | Llega `POST /reset-password` con `{token, newPassword, confirmPassword}`. |
| 9 | Decisión | ¿`newPassword === confirmPassword`? |
| 10 | Fin (error) | `PASSWORDS_DONT_MATCH` (400). |
| 11 | Proceso | `tokenService.verify(dto.token)`. |
| 12 | Decisión | ¿Token válido (no expiró/no manipulado)? |
| 13 | Fin (error) | `catch` → `TOKEN_INVALID`. |
| 14 | Decisión | ¿`payload.type === 'reset'`? *(inferido)* |
| 15 | Fin (error) | `TOKEN_INVALID` por tipo incorrecto. |
| 16 | Proceso | `passwordService.hash()`. |
| 17 | Proceso | `userRepository.updatePassword()`. |
| 18 | Fin (éxito) | Contraseña actualizada; responde 200. |

### Tabla de caminos (V(G) = 5)

| Camino | Nodos | Condición | Resultado esperado |
|---|---|---|---|
| C1 | 1‑2‑3‑4 | Email no corresponde a ningún usuario | Responde 200 sin enviar correo |
| C2 | 1‑2‑3‑5‑6‑7‑8‑9‑10 | Usuario existe y recibe correo, pero contraseñas no coinciden al restablecer | `PASSWORDS_DONT_MATCH` (400) |
| C3 | 1‑2‑3‑5‑6‑7‑8‑9‑11‑12‑13 | Contraseñas coinciden, token inválido/expirado/manipulado | `TOKEN_INVALID` (catch) |
| C4 | 1‑2‑3‑5‑6‑7‑8‑9‑11‑12‑14‑15 | Contraseñas coinciden, token válido, pero tipo incorrecto | `TOKEN_INVALID` (tipo) |
| C5 | 1‑2‑3‑5‑6‑7‑8‑9‑11‑12‑14‑16‑17‑18 | Todo válido | Contraseña hasheada y actualizada; éxito |

---

## 2. FRONTEND — `ForgotPasswordForm` + `ResetPasswordForm` (flujo unificado)

### Código de referencia

```tsx
// frontend/src/features/auth/components/ForgotPasswordForm.tsx
<form onSubmit={handleSubmit(requestReset)} className="space-y-6 w-full max-w-sm">
  <Input id="email" type="email" placeholder="Ingresa tu correo registrado" error={errors.email?.message} {...register('email')} />
  <Button type="submit" isLoading={isLoading} className="w-full mt-8">Enviar enlace</Button>
</form>
```

```tsx
// frontend/src/features/auth/components/ResetPasswordForm.tsx
<form onSubmit={handleSubmit(resetPassword)} className="space-y-6 w-full max-w-sm">
  <input type="hidden" {...register('token')} />
  <Input id="newPassword" type={showPassword ? 'text' : 'password'} {...register('newPassword')} />
  <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} {...register('confirmPassword')} />
  <Button type="submit" isLoading={isLoading} className="w-full mt-8">Guardar contraseña</Button>
</form>
```

> Nota: el hook (`requestReset`, `resetPassword`, el schema de validación de react-hook-form/zod, y el manejo de éxito/error de la petición) **no está incluido** en el fragmento compartido. Los nodos 3, 7, 13 y 17 de la leyenda están **inferidos** a partir de `errors.email?.message` e `isLoading`; valida esos nodos contra el archivo real del hook antes de ejecutar los tests.

### Leyenda de nodos (1-19)

| Nodo | Tipo | Descripción |
|---|---|---|
| 1 | Inicio | Usuario abre `ForgotPasswordForm`. |
| 2 | Proceso | Ingresa email y hace submit (`handleSubmit(requestReset)`). |
| 3 | Decisión | ¿Email válido? *(inferido)* |
| 4 | Fin (validación) | Muestra `errors.email?.message`. |
| 5 | Proceso | `isLoading = true`, llama `requestReset(email)`. |
| 6 | Proceso | `authService.forgotPassword()` → `apiClient.post(...)`. |
| 7 | Decisión | ¿Petición exitosa? *(inferido)* |
| 8 | Fin (error) | Error al enviar la solicitud. |
| 9 | Proceso | Muestra confirmación "revisa tu correo". |
| 10 | Transición | Usuario abre el enlace del correo → navega a `/reset-password?token=...`. |
| 11 | Proceso | Se monta `ResetPasswordForm`; token en `<input type="hidden">`. |
| 12 | Proceso | Ingresa contraseñas y hace submit (`handleSubmit(resetPassword)`). |
| 13 | Decisión | ¿Contraseñas válidas? *(inferido)* |
| 14 | Fin (validación) | Error de formulario. |
| 15 | Proceso | `isLoading = true`, llama `resetPassword(data)`. |
| 16 | Proceso | `authService.resetPassword()` → `apiClient.post(...)`. |
| 17 | Decisión | ¿Petición exitosa? *(inferido)* |
| 18 | Fin (error) | Error del backend (ej. token inválido/expirado). |
| 19 | Fin (éxito) | Confirmación y redirección a login. |

### Tabla de caminos (V(G) = 5)

| Camino | Nodos | Condición | Resultado esperado |
|---|---|---|---|
| C1 | 1‑2‑3‑4 | Email no pasa la validación del formulario | Muestra error de validación, no llama al backend |
| C2 | 1‑2‑3‑5‑6‑7‑8 | Email válido, pero falla la petición `forgot-password` | Muestra error de envío |
| C3 | 1‑2‑3‑5‑6‑7‑9‑10‑11‑12‑13‑14 | Llega el correo, contraseñas no pasan validación al restablecer | Error de validación en `ResetPasswordForm` |
| C4 | 1‑2‑3‑5‑6‑7‑9‑10‑11‑12‑13‑15‑16‑17‑18 | Contraseñas válidas, pero falla la petición `reset-password` | Muestra error del backend |
| C5 | 1‑2‑3‑5‑6‑7‑9‑10‑11‑12‑13‑15‑16‑17‑19 | Todo válido en ambos formularios | Contraseña restablecida, redirige a login |

---

## 3. INTEGRACIÓN — Frontend ↔ Backend (flujo unificado)

### Código de referencia

```typescript
// backend/src/presentation/routes/auth.routes.ts
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
```

```typescript
// backend/src/presentation/controllers/AuthController.ts
forgotPassword = async (req, res, next) => {
  try {
    const dto = requestPasswordResetSchema.parse(req.body);
    await this.requestPasswordResetUseCase.execute(dto);
    sendSuccess(res, null, 'Si el correo existe, recibirás un enlace de recuperación');
  } catch (error) {
    next(error);
  }
};

resetPassword = async (req, res, next) => {
  try {
    const dto = resetPasswordSchema.parse(req.body);
    await this.resetPasswordUseCase.execute(dto);
    sendSuccess(res, null, 'Contraseña actualizada exitosamente');
  } catch (error) {
    next(error);
  }
};
```

```typescript
// frontend/src/features/auth/services/auth.service.ts
async forgotPassword(data: RequestPasswordResetInput): Promise<void> {
  await apiClient.post('/auth/forgot-password', data);
}

async resetPassword(data: ResetPasswordInput): Promise<void> {
  await apiClient.post('/auth/reset-password', data);
}
```

> Nota: el `try/catch` del controlador envuelve **tanto** la validación del DTO (`schema.parse`) **como** la ejecución del caso de uso (`useCase.execute`); por eso ambos tipos de fallo se resuelven en la misma rama de error (`next(error)`). El middleware de manejo de errores de Express detrás de `next(error)` no está incluido en el fragmento compartido — es un patrón estándar, pero valídalo si necesitas el código exacto de la respuesta 4xx.

### Leyenda de nodos (1-15)

| Nodo | Tipo | Descripción |
|---|---|---|
| 1 | Inicio | Usuario envía `ForgotPasswordForm`. |
| 2 | Frontend → Backend | `authService.forgotPassword()` → `apiClient.post('/auth/forgot-password')`. |
| 3 | Backend | Recibe la petición, entra al `try` de `AuthController.forgotPassword`. |
| 4 | Decisión | ¿El bloque `try` se completa sin errores? (DTO inválido o error interno del caso de uso — ver tabla de backend). |
| 5 | Fin (error) | `catch` → `next(error)` → responde 4xx. |
| 6 | Backend | `sendSuccess(res)` → responde 200. |
| 7 | Backend → Frontend | Frontend recibe 200, muestra "revisa tu correo". |
| 8 | Transición | Usuario hace clic en el enlace del correo. |
| 9 | Frontend | Completa `ResetPasswordForm` (token oculto + nueva contraseña). |
| 10 | Frontend → Backend | `authService.resetPassword()` → `apiClient.post('/auth/reset-password')`. |
| 11 | Backend | Recibe la petición, entra al `try` de `AuthController.resetPassword`. |
| 12 | Decisión | ¿El bloque `try` se completa sin errores? (DTO inválido, contraseñas no coinciden, token inválido o de tipo incorrecto — ver tabla de backend). |
| 13 | Fin (error) | `catch` → `next(error)` → responde 4xx. |
| 14 | Backend | `sendSuccess(res)` → responde 200. |
| 15 | Fin (éxito) | Frontend recibe 200, muestra confirmación y redirige a login. |

### Tabla de caminos (V(G) = 3)

| Camino | Nodos | Condición | Resultado esperado |
|---|---|---|---|
| C1 | 1‑2‑3‑4‑5 | Backend rechaza `forgot-password` (DTO inválido o error interno) | Frontend recibe error 4xx |
| C2 | 1‑2‑3‑4‑6‑7‑8‑9‑10‑11‑12‑13 | Correo enviado correctamente, pero backend rechaza `reset-password` | Frontend recibe error 4xx en la segunda fase |
| C3 | 1‑2‑3‑4‑6‑7‑8‑9‑10‑11‑12‑14‑15 | Ambas peticiones aceptadas | Correo enviado y contraseña restablecida; redirige a login |

---

## Entregable esperado

Para cada una de las tres secciones anteriores, genera:

1. El código de los tests (uno por camino, mínimo 5 + 5 + 3 = 13 tests en total).
2. Una breve explicación de qué mocks/stubs configuraste y por qué.
3. Si detectas que algún camino requiere información que no está en este documento (p. ej. el schema de zod exacto, el manejo de errores de Axios en el hook, o la implementación real del middleware de errores), indícalo explícitamente en vez de inventarlo.
