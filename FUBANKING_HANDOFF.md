# FuBanking Handoff

Este archivo es la memoria principal del proyecto. Al iniciar una sesion nueva, leer primero este archivo y luego ejecutar `git status --short --branch`.

## Estado Actual Rapido

- Proyecto: FuBanking, app bancaria con backend Express/TypeScript + Supabase y frontend Next.js/React.
- Rama actual: `main`.
- Carpeta activa del frontend: `frontend/`.
- No desarrollar en `fronted/`; es carpeta vieja/duplicada.
- Supabase esta conectado correctamente desde `backend/.env`.
- Backend compila con `npm run build`. Frontend compila con `npx next build`.
- Tablas creadas en Supabase: `users`, `accounts`, `account_details`, `virtual_cards`, `notifications`, `loan_applications`.
- Todas las foreign keys apuntan a `public.users(id)` (NO `auth.users(id)`).

## Modulos Implementados

| Modulo | Estado | Detalle |
|---|---|---|
| Usuarios/auth | Completo | Registro, login, logout, recuperacion, 2FA. |
| Perfil | Completo | Edicion de perfil. |
| Cuentas | Completo | Crear, listar, depositar, retirar, mostrar/ocultar saldo. |
| Transferencias | Completo | Buscar destinatario, transferir, comprobante. |
| Historial | Parcial | Falta saldo resultante real y filtros completos. |
| Bolsillos | Avanzado | Crear, editar, eliminar, transferir entre bolsillos. |
| Creditos/Prestamos | Completo | Simular, solicitar, ver estado, admin aprueba/rechaza. |
| Tarjetas virtuales | Completo | Crear, listar, bloquear/desbloquear, revelar numero/CVV. |
| Solicitar dinero | Avanzado | Crear, responder solicitudes. |
| Notificaciones | Completo | Crear, listar, marcar leida. Notificaciones automaticas en creditos. |
| Admin creditos | Completo | Middleware admin, listar todas las solicitudes, aprobar/rechazar. |

## Sistema De Creditos — Flujo Completo

### Backend

1. **Crear solicitud** — `POST /loans`
   - Valida que el usuario no tenga un prestamo PENDING
   - Guarda en `loan_applications` con status PENDING
   - Crea notificacion al usuario
   - Crea notificacion a todos los admins

2. **Ver mis prestamos** — `GET /loans/me`
   - Devuelve todos los prestamos del usuario con sus estados

3. **Simular prestamo** — `POST /loans/simulate`
   - Calcula cuota mensual, total a pagar, intereses

4. **Admin: listar todos** — `GET /loans/admin` (requiere role admin)
   - Devuelve todas las solicitudes de prestamo

5. **Admin: aprobar** — `PATCH /loans/admin/:id/approve`
   - Cambia status a APPROVED
   - Crea cuenta CREDITO con loanId y cuotas en details
   - Notifica al usuario

6. **Admin: rechazar** — `PATCH /loans/admin/:id/reject`
   - Cambia status a REJECTED
   - Notifica al usuario

### Frontend

- `/loans` — Pagina del usuario: simulador, solicitar, ver historial de solicitudes con estado
- `/admin/loans` — Pagina del admin: listar todas, filtrar por estado, aprobar/rechazar

### Reglas De Negocio

- Solo 1 prestamo PENDING por usuario a la vez
- Al aprobar se crea una cuenta tipo CREDITO automaticamente
- El admin recibe notificacion cuando alguien solicita un prestamo
- El usuario recibe notificacion cuando su prestamo es aprobado o rechazado

### Tabla loan_applications

```sql
CREATE TABLE public.loan_applications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  amount NUMERIC(15,2),
  installments INTEGER,
  annual_rate NUMERIC(5,2),
  monthly_income NUMERIC(15,2),
  monthly_payment NUMERIC(15,2),
  total_to_pay NUMERIC(15,2),
  total_interest NUMERIC(15,2),
  document_verified BOOLEAN,
  age_verified BOOLEAN,
  income_verified BOOLEAN,
  credit_history_verified BOOLEAN,
  eligibility JSONB,
  status TEXT CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ
);
```

### Cuenta CREDITO

Cuando se aprueba un prestamo, se crea una cuenta con:
- `account_type = 'CREDITO'`
- `details.loanId` = ID del prestamo
- `details.installments` = numero de cuotas
- `balance = 0` (se usa como cupo, no como saldo)

## Admin Setup

### Crear usuario admin

1. Registrar usuario normal desde la app
2. Ejecutar en Supabase SQL Editor:

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'admin@fubanking.com';
```

### Credenciales de prueba

| Campo | Valor |
|-------|-------|
| Email | admin@fubanking.com |
| Password | Admin123! |

### Middleware admin

`backend/src/presentation/middlewares/adminMiddleware.ts` — verifica JWT + role = 'admin'.

Las rutas admin en `loan.routes.ts` usan `authMiddleware` + `adminMiddleware`.

## Migraciones SQL (Ejecutar en Supabase SQL Editor)

Las migraciones estan en `backend/supabase/migrations/`. Se ejecutan manualmente copiando y pegando en el SQL Editor de Supabase.

```txt
202607290001_create_virtual_cards.sql
202607290002_create_notifications.sql
202607290003_create_loan_applications.sql
202607300001_add_admin_role_and_credit_account.sql
202607300002_fix_loan_applications_fk.sql
```

IMPORTANTE: Las foreign keys deben apuntar a `public.users(id)`, NO a `auth.users(id)`. La app genera sus propios UUIDs con `randomUUID()`.

## Como Ejecutar El Proyecto

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend: `http://localhost:3001/api/v1`

Variables en `backend/.env`:

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=...
JWT_EXPIRES_IN=7d
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
CLIENT_URL=http://localhost:3000
GMAIL_USSER=...
GMAIL_PASS=...
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:3000`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Endpoints Principales

Base: `/api/v1`

### Creditos / Prestamos

```http
POST   /loans/simulate          # Simular prestamo
POST   /loans                   # Solicitar prestamo (1 pending max)
GET    /loans/me                # Ver mis prestamos
GET    /loans/admin             # Admin: listar todos
PATCH  /loans/admin/:id/approve # Admin: aprobar (crea cuenta CREDITO)
PATCH  /loans/admin/:id/reject  # Admin: rechazar
```

### Cuentas

```http
GET  /accounts/me
GET  /accounts/:id
POST /accounts
POST /accounts/:id/deposit
POST /accounts/:id/withdraw
GET  /accounts/search?accountNumber=...
```

### Transferencias

```http
POST /transfers
GET  /transfers/:id
GET  /transfers/account/:accountId
GET  /transfers/search/email?email=...
```

### Bolsillos

```http
POST   /pockets
GET    /pockets/account/:accountId
PATCH  /pockets/:pocketId
DELETE /pockets/:pocketId
POST   /pockets/transfer
```

### Tarjetas Virtuales

```http
POST  /cards
GET   /cards/me
GET   /cards/:id/reveal
PATCH /cards/:id/toggle-lock
```

### Solicitar Dinero

```http
POST   /money-requests
GET    /money-requests/me
PATCH  /money-requests/:id/respond
```

### Notificaciones

```http
GET   /notifications/me
PATCH /notifications/:id/read
```

### Pagos De Servicios

```http
POST /payments
GET  /payments/me
```

## Convenciones

### API Client

```ts
import { apiClient } from '@/shared/services/api.client';
const response = await apiClient.get<T>('/endpoint');
return response.data;
```

### Toasts

```ts
import { useToast } from '@/shared/components/feedback/ToastProvider';
const toast = useToast();
toast.success('Titulo', 'Detalle');
toast.error('Titulo', 'Detalle');
```

No usar `alert()`.

### UI

- Estetica banking limpia tipo Nubank.
- Iconos: `lucide-react`.
- Tokens: `bg-card`, `border`, `foreground`, `muted`, `primary`.
- Mobile responsive obligatorio.

### Entidades y Serializacion

Las entidades de dominio (Account, User, LoanApplication) tienen metodos `toPublic()` o `toDto()` que devuelven objetos planos. **Siempre usar estos metodos** antes de enviar datos al frontend, porque `JSON.stringify` en clases no serializa getters del prototipo.

### Brand

- Color primario: purple `#820AD1`
- Logo: `frontend/public/logo.png`
- Navbar: "Fu" en purple, "bank" en foreground
- Fuentes: Nunito (display), Poppins (cuerpo)

## Pendientes Tecnicos

1. **Limpiar secretos** — `backend/.env.example` tiene llaves reales. Quitar placeholders, rotar key.
2. **Lint global frontend** — Errores preexistentes en auth/profile/account/Label/useAuth/Navbar.
3. **Duplicidad pocket vs pockets** — Elegir una convencion.
4. **Historial: saldo resultante** — Falta devolver saldo resultante por movimiento.
5. **Relacion credito-tarjeta** — Un credito aprobado podria asociarse a una tarjeta virtual.

## Orden Recomendado Para La Proxima Sesion

1. QA completo del flujo de creditos: solicitar -> admin aprueba -> usuario ve cuenta CREDITO.
2. Crear cuenta CREDITO visible en `/accounts` con saldo/cupo.
3. Probar tarjeta virtual asociada a cuenta CREDITO.
4. Resolver lint global del frontend.
5. Consolidar `pocket` vs `pockets`.
6. Implementar saldo resultante en historial.
7. QA de todos los modulos restantes.

## Checklist De QA

```bash
cd backend && npm run build
cd ../frontend && npx next build
```

Flujos manuales:

- registrar usuario
- iniciar sesion
- recuperar contrasena
- editar perfil
- activar/desactivar 2FA
- crear cuenta
- ocultar/mostrar saldo
- depositar
- retirar
- transferir a otro usuario
- ver comprobante
- revisar historial
- pagar servicio
- crear bolsillo
- mover dinero entre bolsillos
- simular credito
- solicitar credito (verificar: 1 pendiente max, notificacion a admin)
- ver mis prestamos con estado
- admin: ver solicitudes, aprobar, rechazar
- usuario: ver cambio de estado + notificacion
- crear tarjeta virtual
- revelar numero/CVV
- bloquear/desbloquear tarjeta
- solicitar dinero
- aceptar/rechazar solicitud
- ver notificaciones
- marcar notificacion como leida
