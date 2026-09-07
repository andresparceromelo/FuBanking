# Prompt: Generar pruebas unitarias de caja blanca — Login (sin 2FA)

Actúa como un ingeniero de QA/testing senior especializado en TypeScript. A continuación te entrego el código fuente y las **tablas de caminos** (basis path testing) ya construidas para la funcionalidad de inicio de sesión de una aplicación, considerando **únicamente el flujo sin autenticación de dos factores (2FA)**. Necesito que generes las pruebas unitarias correspondientes a cada camino, para tres capas: backend, frontend e integración.

## Stack técnico

- Backend: TypeScript, arquitectura por capas (domain/application/infrastructure/presentation), Express.
- Frontend: Next.js (App Router), React, `react-hook-form` + `@hookform/resolvers/zod`, Zod para validación, `axios` como cliente HTTP.
- Testing sugerido: **Jest** para el backend, **Vitest + React Testing Library** para el frontend, **msw** o `axios-mock-adapter` para mockear peticiones HTTP en las pruebas de integración.

## Instrucciones generales

1. Genera **un archivo de test por capa** (backend, frontend/schema, frontend/component, integración), cada uno con un `describe` por camino de la tabla correspondiente y un `it`/`test` que verifique tanto el **valor de retorno** como las **llamadas a los mocks/dependencias** (spies) donde aplique.
2. Usa el nombre del camino (ej. `1,2,3,9,F`) en la descripción del test para que quede trazable a la tabla.
3. No repitas el número de casos: cada camino de cada tabla debe ser exactamente un test (salvo que identifiques una variante de datos límite que valga la pena aclarar como test adicional; en ese caso, indícalo explícitamente como "caso extra" fuera de la tabla).
4. Mantén los mensajes de error y códigos exactamente como aparecen en el código (`'Correo o contraseña incorrectos'`, `'INVALID_CREDENTIALS'`, `'ACCOUNT_INACTIVE'`, etc.).
5. Donde se necesite mockear una dependencia (repositorio, servicio, hook, axios), usa el patrón estándar de la librería de testing indicada (jest.fn() / vi.fn() con mocks tipados).

---

## 1. Backend — Caso de uso `LoginUser` (sin 2FA)

### Código

```typescript
export class LoginUser {
  private readonly generateTwoFactorCode: GenerateTwoFactorCode;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
    private readonly verificationCodeRepository: IVerificationCodeRepository,
    private readonly emailService: IEmailService,
  ) {
    this.generateTwoFactorCode = new GenerateTwoFactorCode(
      verificationCodeRepository,
      emailService,
      tokenService,
    );
  }

  async execute(dto: LoginUserDto): Promise<LoginUserResponseDto> {
    const genericError = new AuthError(
      'Correo o contraseña incorrectos',
      'INVALID_CREDENTIALS',
    );

    const user = await this.userRepository.findByEmail(dto.email.toLowerCase().trim());
    if (!user) throw genericError;

    if (!user.isActive) {
      throw new AuthError('Esta cuenta ha sido desactivada', 'ACCOUNT_INACTIVE');
    }

    const isPasswordValid = await this.passwordService.compare(
      dto.password,
      user.getPasswordHash(),
    );
    if (!isPasswordValid) throw genericError;

    // Flujo sin 2FA únicamente (twoFactorEnabled = false)
    const tokenOptions: TokenOptions = { expiresIn: dto.rememberMe ? '30d' : '7d' };
    const token = this.tokenService.generate(
      { userId: user.id, email: user.email.toString() },
      tokenOptions,
    );
    return {
      requiresTwoFactor: false,
      user: user.toPublic(),
      token,
    };
  }
}
```

Dependencias a mockear: `userRepository` (`findByEmail`), `passwordService` (`compare`), `tokenService` (`generate`).

### Tabla de caminos (V(G) = 4)

| Camino | Entrada | Prueba | Salida esperada |
|---|---|---|---|
| 1,2,3,9,F | `email` no registrado → `user = null` | `!user = true` | `throw AuthError('Correo o contraseña incorrectos', 'INVALID_CREDENTIALS')` |
| 1,2,4,5,9,F | `user` existe, `isActive = false` | `!isActive = true` | `throw AuthError('Esta cuenta ha sido desactivada', 'ACCOUNT_INACTIVE')` |
| 1,2,4,6,7,9,F | `user` existe, activo, password no coincide con el hash | `!isPasswordValid = true` | `throw AuthError('Correo o contraseña incorrectos', 'INVALID_CREDENTIALS')` |
| 1,2,4,6,8,9,F | `user` existe, activo, password correcta | todos `false` | `tokenService.generate()` invocado; retorna `{ requiresTwoFactor: false, user, token }` |

**Nota:** los caminos 1 y 3 producen el mismo mensaje observable, pero corresponden a mocks distintos (`findByEmail` retorna `null` vs. `passwordService.compare` retorna `false`) — verifícalos por separado con spies.

---

## 2. Frontend — Esquema `loginSchema` (Zod)

### Código

```typescript
export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido').toLowerCase().trim(),
  password: z.string().min(1, 'La contraseña es requerida'),
  rememberMe: z.boolean().optional(),
});
```

Esta es validación pura declarativa (sin mocks necesarios). Usa `loginSchema.safeParse(input)`.

### Tabla de caminos (V(G) = 4)

| Camino | Entrada | Prueba | Salida esperada |
|---|---|---|---|
| 1,2,4,6,8,9,F | `email='ana@mail.com'`, `password='abc123'` | `issues.length = 0` | `{ success: true, data: { email, password, rememberMe } }` |
| 1,2,3,4,6,7,9,F | `email='ana-arroba-mail'`, `password='abc123'` | issue solo en `email` | `{ success: false, error }` con issue `'Correo electrónico inválido'` |
| 1,2,4,5,6,7,9,F | `email='ana@mail.com'`, `password=''` | issue solo en `password` | `{ success: false, error }` con issue `'La contraseña es requerida'` |
| 1,2,3,4,5,6,7,9,F | `email='ana-arroba-mail'`, `password=''` | issues en ambos campos | `{ success: false, error }` con **ambos** issues presentes simultáneamente en `error.issues` |

---

## 3. Frontend — Componente `LoginForm`

### Código

```tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '../schemas/auth.schemas';
import { useLogin } from '../hooks/useLogin';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Label } from '@/shared/components/ui/Label';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export function LoginForm() {
  const { handleLogin, isLoading, error } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = (data: LoginInput) => {
    handleLogin(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-sm">
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
          {error.message}
        </div>
      )}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" type="email" error={errors.email?.message} {...register('email')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              error={errors.password?.message}
              {...register('password')}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register('rememberMe')} />
          <span className="text-sm font-medium">Recordarme</span>
        </label>
      </div>
      <Button type="submit" isLoading={isLoading} className="w-full mt-8">Continuar</Button>
    </form>
  );
}
```

Dependencia a mockear: el hook `useLogin` (usa `jest.mock`/`vi.mock` sobre el módulo `../hooks/useLogin`, retornando `handleLogin`, `isLoading` y `error` controlados por cada test).

### Tabla de caminos (V(G) = 4)

| Camino | Entrada | Prueba | Salida esperada |
|---|---|---|---|
| 1,2,4,5,6,7,12,F | Mock de `useLogin` sin error previo (`error=null`). `email=''`, `password=''` | Formulario inválido en el cliente | Se muestran mensajes de error junto a los campos (`errors.email`, `errors.password`); `handleLogin` **no** se invoca |
| 1,2,3,4,5,6,7,12,F | Mock de `useLogin` con `error={message:'Correo o contraseña incorrectos'}`. `email='x'`, `password=''` | Banner de error visible y formulario inválido a la vez | Se ve el banner **y** los mensajes inline al mismo tiempo |
| 1,2,4,5,6,8,9,10,12,F | Mock de `useLogin` sin error previo, `handleLogin` simulado para rechazar (401). `email='ana@mail.com'`, `password='wrong'` | Formulario válido, backend rechaza | `handleLogin` se invoca con los datos correctos; se verifica que fue llamado (el resultado del error lo maneja el hook, no el componente) |
| 1,2,4,5,6,8,9,11,12,F | Mock de `useLogin` sin error previo, `handleLogin` simulado para resolver OK. `email='ana@mail.com'`, `password='correcta123'` | Formulario válido, backend acepta | `handleLogin` se invoca con `{ email, password, rememberMe }` correctos |

---

## 4. Integración — Recorrido completo (frontend + backend), sin 2FA

### Piezas relevantes

**Hook `useLogin`** (simplificado, sin la rama 2FA):
```typescript
const handleLogin = async (data: LoginInput) => {
  setIsLoading(true);
  setError(null);
  try {
    const response = await authService.login(data); // POST /api/v1/auth/login
    login(response.user, response.token); // guarda estado global de autenticación
  } catch (err: any) {
    setError(err as AuthError); // { code, message }
  } finally {
    setIsLoading(false);
  }
};
```

**Interceptor de respuesta de `apiClient` (Axios):**
```typescript
apiClient.interceptors.response.use(
  (response) => response.data, // desenvuelve { success, data, message } → retorna solo `data`
  (error) => {
    if (error.response?.data?.error) {
      return Promise.reject(error.response.data.error); // { code, message } directo
    }
    return Promise.reject({ code: 'NETWORK_ERROR', message: 'No se pudo conectar al servidor.' });
  }
);
```

**Mapeo de errores del backend (`errorHandler` middleware):**

| Tipo de error | Código | HTTP Status |
|---|---|---|
| Credenciales inválidas | `INVALID_CREDENTIALS` | 401 |
| Cuenta inactiva | `ACCOUNT_INACTIVE` | 401 |
| Error de validación Zod | `VALIDATION_ERROR` | 400 |

Recorrido: `LoginForm.onSubmit → useLogin.handleLogin → authService.login (POST) → apiClient interceptors → AuthController.login → loginSchema.parse(req.body) → LoginUser.execute(dto) → respuesta HTTP → interceptor → hook → LoginForm`.

Para estas pruebas, monta el `LoginForm` con React Testing Library y **mockea la capa de red** (recomendado: `msw`, alternativa: `axios-mock-adapter`) simulando las respuestas del backend descritas abajo. No mockees `useLogin` aquí — la idea es probar la integración real entre el formulario, el hook y el cliente HTTP.

### Tabla de caminos (V(G) = 6)

| Camino | Entrada | Prueba | Salida esperada |
|---|---|---|---|
| 1,2,3,17,F | `email`/`password` con formato inválido en el formulario | El navegador rechaza antes de enviar | No se hace ninguna petición de red (verificar que el mock de red no fue llamado); se ven errores inline |
| 1,2,4,5,6,15,17,F | Datos válidos en cliente, backend responde 400 `VALIDATION_ERROR` (mock) | Cliente dice válido, servidor dice inválido | El formulario muestra el mensaje de error devuelto por el servidor |
| 1,2,4,5,7,8,9,15,17,F | Backend responde 401 `INVALID_CREDENTIALS` (mock, correo no registrado) | — | El formulario muestra `'Correo o contraseña incorrectos'` |
| 1,2,4,5,7,8,10,11,15,17,F | Backend responde 401 `ACCOUNT_INACTIVE` (mock) | — | El formulario muestra `'Esta cuenta ha sido desactivada'` |
| 1,2,4,5,7,8,10,12,13,15,17,F | Backend responde 401 `INVALID_CREDENTIALS` (mock, password incorrecta) | — | El formulario muestra `'Correo o contraseña incorrectos'` |
| 1,2,4,5,7,8,10,12,14,16,17,F | Backend responde 200 con `{ requiresTwoFactor: false, token, user }` (mock) | — | Se invoca la función de guardar sesión (`login(user, token)`) con los datos correctos; no se muestra ningún error |

---

## Entregable esperado

Genera 4 archivos de test (uno por sección de este documento), cada uno completo y ejecutable, con los imports, mocks y setup necesarios según el stack indicado arriba. Si detectas que falta algún tipo, interfaz o mock que no te proporcioné, indícalo explícitamente al inicio de tu respuesta en vez de inventarlo.
