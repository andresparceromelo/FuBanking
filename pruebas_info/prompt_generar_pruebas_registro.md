# Prompt: Generar pruebas unitarias manuales (sin mocks) — Registro de usuario

## Contexto

Tengo una funcionalidad de **registro de usuario** implementada en dos capas: un backend en TypeScript (arquitectura limpia, caso de uso `RegisterUser`) y un frontend en Next.js/React (`react-hook-form` + `zod`, componente `RegisterForm`). Ya hice el análisis de caja blanca (grafo de flujo, diagrama de flujo y tabla de caminos básicos de McCabe) para tres alcances: backend, frontend (schema de validación), e integración (front + back juntos). Necesito que generes las **pruebas unitarias** correspondientes a cada camino de las tablas.

## Código fuente

### Backend: `RegisterUser.ts`

```typescript
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordService } from '../../interfaces/IPasswordService';
import { ITokenService } from '../../interfaces/ITokenService';
import { RegisterUserDto, RegisterUserResponseDto } from '../../dtos/auth/auth.dtos';
import { User } from '../../../domain/entities/User';
import { Email } from '../../../domain/value-objects/Email';
import { Document } from '../../../domain/value-objects/Document';
import { AuthError } from '../../../shared/errors/AuthError';
import { AppError } from '../../../shared/errors/AppError';
import { randomUUID } from 'crypto';

export class RegisterUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(dto: RegisterUserDto): Promise<RegisterUserResponseDto> {
    if (dto.password !== dto.confirmPassword) {
      throw new AppError('Las contraseñas no coinciden', 400, 'PASSWORDS_DONT_MATCH');
    }

    const email = new Email(dto.email);
    const document = new Document(dto.document);

    const existingByEmail = await this.userRepository.findByEmail(email.toString());
    if (existingByEmail) {
      throw new AuthError('Ya existe una cuenta con este correo electrónico', 'EMAIL_ALREADY_EXISTS');
    }

    const existingByDoc = await this.userRepository.findByDocument(document.toString());
    if (existingByDoc) {
      throw new AuthError('Ya existe una cuenta con este documento', 'DOCUMENT_ALREADY_EXISTS');
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    const user = User.create({
      id: randomUUID(),
      email,
      document,
      firstName: dto.firstName.trim(),
      middleName: dto.middleName?.trim() || null,
      lastName: dto.lastName.trim(),
      secondLastName: dto.secondLastName?.trim() || null,
      birthDate: new Date(dto.birthDate),
      phone: dto.phone ?? null,
      passwordHash,
    });

    const savedUser = await this.userRepository.save(user);

    const token = this.tokenService.generate({
      userId: savedUser.id,
      email: savedUser.email.toString(),
    });

    return {
      user: savedUser.toPublic(),
      token,
    };
  }
}
```

### Frontend: `auth.schemas.ts`

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido').toLowerCase().trim(),
  password: z.string().min(1, 'La contraseña es requerida'),
  rememberMe: z.boolean().optional(),
});

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número');

export const registerSchema = z.object({
  firstName: z.string().min(2, 'El primer nombre debe tener al menos 2 caracteres').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras y espacios'),
  middleName: z.string().regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, 'Solo se permiten letras y espacios').optional(),
  lastName: z.string().min(2, 'El primer apellido debe tener al menos 2 caracteres').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras y espacios'),
  secondLastName: z.string().regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, 'Solo se permiten letras y espacios').optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido (YYYY-MM-DD)').refine((date) => new Date(date) <= new Date(), 'La fecha no puede ser en el futuro'),
  email: z.string().email('Correo electrónico inválido').toLowerCase().trim(),
  document: z.string().min(5, 'Documento inválido').regex(/^[a-zA-Z0-9]+$/, 'Solo letras y números'),
  phone: z.string().optional(),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

export type RegisterInput = z.infer<typeof registerSchema>;
```

### Frontend: `RegisterForm.tsx` (resumen funcional)

```typescript
const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
  resolver: zodResolver(registerSchema),
  defaultValues: { firstName: '', middleName: '', lastName: '', secondLastName: '', birthDate: '', email: '', document: '', phone: '', password: '', confirmPassword: '' },
});

const onSubmit = (data: RegisterInput) => {
  handleRegister(data); // proviene de useRegister(), hace la llamada HTTP al backend
};
```

## Tablas de caminos (McCabe)

### 1. Backend — `RegisterUser.execute()` — V(G) = 4

Nodos: N1 Inicio · N2 `password !== confirmPassword` · N3 Error `PASSWORDS_DONT_MATCH` (400) · N4 Crear VOs + `findByEmail` · N5 `existingByEmail` · N6 Error `EMAIL_ALREADY_EXISTS` (409) · N7 `findByDocument` · N8 `existingByDoc` · N9 Error `DOCUMENT_ALREADY_EXISTS` (409) · N10 hash + crear + guardar + JWT · N11 Retorna `{ user, token }`

| Camino | Entrada | Prueba | Salida |
|---|---|---|---|
| N1→N2→N4→N5→N7→N8→N10→N11 | Todas las condiciones falsas | password=confirmPassword; email y documento no existen | Usuario creado, `save()` llamado, JWT generado, retorna `{ user, token }` |
| N1→N2→N3 | `password !== confirmPassword` = true | password ≠ confirmPassword | `AppError('PASSWORDS_DONT_MATCH', 400)`. No debe llamarse `findByEmail` |
| N1→N2→N4→N5→N6 | Passwords OK, `existingByEmail` = true | `findByEmail` retorna un usuario existente | `AuthError('EMAIL_ALREADY_EXISTS')`. No debe llamarse `findByDocument` |
| N1→N2→N4→N5→N7→N8→N9 | Passwords OK, email no existe, `existingByDoc` = true | `findByEmail` retorna null; `findByDocument` retorna un usuario existente | `AuthError('DOCUMENT_ALREADY_EXISTS')`. No debe llamarse `passwordService.hash` |

### 2. Frontend — `registerSchema` (Zod) — V(G) = 8

Nodos: N1 Datos del formulario · N2 `firstName` válido · N3 Error firstName · N4 `lastName` válido · N5 Error lastName · N6 `birthDate` válido · N7 Error birthDate · N8 `email` válido · N9 Error email · N10 `document` válido · N11 Error document · N12 `password` válido · N13 Error password · N14 `refine` passwords coinciden · N15 Error confirmPassword · N16 `safeParse` exitoso

| Camino | Entrada | Prueba | Salida |
|---|---|---|---|
| 1,2,4,6,8,10,12,14,16,F | Todos los campos válidos | firstName="Juan", lastName="Pérez", birthDate="1990-01-01", email="juan@test.com", document="ABC12345", password=confirmPassword="Password123" | `safeParse` exitoso, sin errores |
| 1,2,3,F | firstNameOK=false | firstName="J" | Error: "El primer nombre debe tener al menos 2 caracteres" |
| 1,2,4,5,F | lastNameOK=false | lastName="P3rez" | Error: "Solo se permiten letras y espacios" (lastName) |
| 1,2,4,6,7,F | birthDateOK=false | birthDate="2030-01-01" | Error: "La fecha no puede ser en el futuro" |
| 1,2,4,6,8,9,F | emailOK=false | email="correo-invalido" | Error: "Correo electrónico inválido" |
| 1,2,4,6,8,10,11,F | documentOK=false | document="AB1" | Error: "Documento inválido" |
| 1,2,4,6,8,10,12,13,F | passwordOK=false | password="abcdefgh" | Error: "Debe contener al menos una mayúscula" |
| 1,2,4,6,8,10,12,14,15,F | matchOK=false | password="Password123", confirmPassword="Otra456" | Error: "Las contraseñas no coinciden" (path: confirmPassword) |

### 3. Integración (frontend + backend) — V(G) = 5

Nodos: N1 Inicio · N2 Entrada de datos (usuario completa formulario) · N3 `registerSchema` válido (Zod) · N4 Errores de campo (sin llamada API) · N5 `handleRegister(data)` → POST al backend · N6 `password !== confirmPassword` (backend) · N7 Error 400 `PASSWORDS_DONT_MATCH` · N8 `findByEmail()` · N9 Error 409 `EMAIL_ALREADY_EXISTS` · N10 `findByDocument()` · N11 Error 409 `DOCUMENT_ALREADY_EXISTS` · N12 hash + crear + guardar + JWT · N13 Retorna 201 `{ user, token }`

| Camino | Entrada | Prueba | Salida |
|---|---|---|---|
| 1,2,3,5,6,8,10,12,13,F | FormularioOK=Sí, PasswordsOK=Sí, EmailDisp=Sí, DocDisp=Sí | Todos los campos válidos; mocks retornan null en ambas búsquedas | 201, `{ user, token }` |
| 1,2,3,4,F | FormularioOK=No | firstName="J" | Errores de campo; sin llamada al backend |
| 1,2,3,5,6,7,F | FormularioOK=Sí, PasswordsOK=No | Backend simulado con password !== confirmPassword | Error 400 en la UI |
| 1,2,3,5,6,8,9,F | FormularioOK=Sí, PasswordsOK=Sí, EmailDisp=No | findByEmail() retorna usuario existente | Error 409 (email) en la UI |
| 1,2,3,5,6,8,10,11,F | FormularioOK=Sí, PasswordsOK=Sí, EmailDisp=Sí, DocDisp=No | findByDocument() retorna usuario existente | Error 409 (documento) en la UI |

## Instrucciones para generar las pruebas

1. Genera **una prueba unitaria por cada camino** de las tres tablas anteriores (4 + 8 + 5 = 17 pruebas como mínimo).
2. Las pruebas deben ser **manuales y lo más simples/básicas posible**.
3. **No uses NINGUNA librería ni utilidad de mocking** (nada de `jest.mock`, `jest.fn()`, `sinon`, `ts-mockito`, `MSW`, spies automáticos, etc.). Si necesitas una dependencia falsa (repositorio, servicio de hash, servicio de tokens, llamada HTTP), constrúyela **a mano** como una clase u objeto plano que implemente la interfaz correspondiente, usando datos fijos o arrays en memoria.
4. Usa Jest (o el framework que ya use el proyecto) **únicamente como corredor de pruebas y para los `expect`**, nunca para generar mocks.
5. Backend: implementa a mano fakes de `IUserRepository`, `IPasswordService` e `ITokenService` (por ejemplo, clases con arrays en memoria o valores fijos retornados).
6. Frontend (schema): usa directamente `registerSchema.safeParse(datos)` con datos de prueba reales, sin ningún mock de Zod.
7. Integración: simula la llamada HTTP con una función escrita a mano (por ejemplo, un `switch` simple que retorna distintas respuestas según el input), no con librerías de interceptación de red.
8. **No agregues documentación, comentarios ni texto explicativo dentro de los archivos de test.** El archivo debe contener únicamente el código de las pruebas (imports, el fake mínimo necesario, y los bloques `describe`/`it`), sin comentarios de encabezado ni explicaciones por prueba.
9. Nombra cada `it(...)` referenciando el número/secuencia de camino de la tabla correspondiente (ej. `it('1,2,4,5,7,8,10,11,F', ...)`), sin explicación adicional.
10. Organiza los archivos de test por capa: uno para backend, uno para frontend (schema), y uno para integración.

## Entregable esperado

Tres archivos de test completos y ejecutables, uno por capa, sin ningún mock automático, sin comentarios ni documentación textual — solo código.
