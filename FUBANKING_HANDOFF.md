# FuBanking Handoff

Este archivo es la memoria principal del proyecto. Al iniciar una sesion nueva, leer primero este archivo y luego ejecutar `git status --short --branch`.

## Estado Actual Rapido

- Proyecto: FuBanking, app bancaria con backend Express/TypeScript + Supabase y frontend Next.js/React.
- Rama actual: `main`.
- Remoto `origin/main` ya fue traido e integrado el 2026-07-29. Commit remoto integrado: `edfbc0a Update pockets`.
- Hay una rama de respaldo creada antes del merge: `codex/backup-before-pull-merge`.
- Hay un stash de respaldo que no se borro: `stash@{0}: codex-before-origin-main-merge`.
- Carpeta activa del frontend: `frontend/`.
- No desarrollar en `fronted/`; es carpeta vieja/duplicada y se esta eliminando del trabajo local.
- Supabase esta conectado correctamente desde `backend/.env`.
- La tabla `public.virtual_cards` ya fue creada en Supabase ejecutando la migracion SQL de este repo.
- Tarjetas virtuales ya permiten crear, listar, bloquear/desbloquear y revelar numero completo/CVV desde el reverso.
- Decision de producto: la tarjeta virtual actual funciona como tarjeta asociada a cuenta. La idea futura es que un credito aprobado pueda ser usado por tarjeta virtual.
- Backend compila actualmente con `npm run build`.
- Lint global del frontend aun falla por deuda previa en auth/profile/account/Label/useAuth/Navbar, pero el lint focalizado de tarjetas paso.
- No revertir cambios locales existentes. Hay muchos cambios pendientes de commit.

## Cambios Hechos Hoy

### Pull Pendiente Integrado

Se ejecuto `git fetch origin` y `git merge --ff-only origin/main`.

El remoto avanzo:

```txt
5303580 -> edfbc0a Update pockets
```

Conflictos resueltos:

- `frontend/src/app/(dashboard)/loans/page.tsx`
- `frontend/src/app/(dashboard)/pockets/page.tsx`

Resolucion aplicada:

- Mantener la arquitectura nueva del pull: paginas como wrappers server que importan clientes.
- `loans/page.tsx` renderiza `LoansClient`.
- `pockets/page.tsx` renderiza `PocketsClient`.
- Se agrego compatibilidad en `frontend/src/features/loans/services/loan.service.ts` para soportar nombres usados por ambos lados: `simulate/create` y `simulateLoan/createLoan`.

### Supabase: Tabla De Tarjetas Virtuales

El error original era:

```txt
Could not find the table 'public.virtual_cards' in the schema cache
```

Diagnostico:

- La conexion a Supabase estaba bien.
- El backend leia `backend/.env`.
- El backend usaba `SUPABASE_SERVICE_ROLE_KEY`.
- El problema real era que la tabla `public.virtual_cards` no existia en el proyecto Supabase.

Se creo esta migracion:

```txt
backend/supabase/migrations/202607290001_create_virtual_cards.sql
```

La migracion crea:

- `public.virtual_cards`
- columnas: `id`, `user_id`, `account_id`, `card_holder_name`, `card_number`, `last_four`, `expiration_date`, `cvv`, `status`, `created_at`, `updated_at`
- indices por `user_id`, `account_id`, `created_at`
- checks de formato para numero, ultimos 4, fecha, CVV y estado
- trigger `set_virtual_cards_updated_at`

Ya fue ejecutada en Supabase y verificada con consulta directa. Resultado:

```json
{ "ok": true, "table": "virtual_cards", "rows": 0 }
```

### Tarjeta Virtual: Revelar Numero Y CVV

Problema:

- En el reverso de la tarjeta se veia un elemento tipo boton para ver CVV.
- No era funcional porque el backend solo devolvia `cvvMasked: '***'`.

Solucion implementada:

- Nuevo caso de uso backend:
  - `backend/src/application/use-cases/card/RevealVirtualCardDetails.ts`
- Nuevo endpoint:
  - `GET /api/v1/cards/:id/reveal`
- El endpoint:
  - requiere JWT
  - busca la tarjeta por ID
  - valida que pertenezca al usuario autenticado
  - no revela datos si esta cancelada
  - devuelve `cardNumber` y `cvv`
- Frontend:
  - `frontend/src/features/cards/services/card.service.ts` agrega `revealDetails(cardId)`
  - `frontend/src/features/cards/types/card.types.ts` agrega `RevealedVirtualCardDetails`
  - `frontend/src/features/cards/components/VirtualCard.tsx` ahora tiene boton real:
    - `Ver numero y CVV`
    - `Ocultar numero y CVV`
  - El boton detiene propagacion para no voltear la tarjeta accidentalmente.

Validaciones realizadas:

```bash
cd backend
npm run build

cd ../frontend
npx eslint src/features/cards/components/VirtualCard.tsx src/features/cards/services/card.service.ts src/features/cards/types/card.types.ts
```

Ambas pasaron.

## Como Ejecutar El Proyecto

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend esperado:

```txt
http://localhost:3001/api/v1
```

Variables requeridas en `backend/.env`:

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

Importante: `SUPABASE_SERVICE_ROLE_KEY` no debe exponerse en frontend ni versionarse. Actualmente `backend/.env.example` contiene llaves reales; pendiente limpiarlo y rotar la llave en Supabase.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend esperado:

```txt
http://localhost:3000
```

El frontend usa:

```ts
NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
```

Si hace falta:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Endpoints Principales

Base:

```txt
/api/v1
```

La mayoria requieren:

```http
Authorization: Bearer <token>
```

### Cuentas

```http
GET /accounts/me
GET /accounts/:id
POST /accounts
POST /accounts/:id/deposit
POST /accounts/:id/withdraw
GET /accounts/search?accountNumber=...
```

### Transferencias

```http
POST /transfers
GET /transfers/:id
GET /transfers/account/:accountId
GET /transfers/search/email?email=...
```

### Bolsillos

```http
POST /pockets
GET /pockets/account/:accountId
PATCH /pockets/:pocketId
DELETE /pockets/:pocketId
POST /pockets/transfer
```

### Creditos / Prestamos

```http
POST /loans/simulate
POST /loans
```

### Tarjetas Virtuales

```http
POST /cards
GET /cards/me
GET /cards/:id/reveal
PATCH /cards/:id/toggle-lock
```

Payload crear:

```ts
{
  accountId: string;
}
```

Respuesta publica:

```ts
{
  id: string;
  userId: string;
  accountId: string;
  cardHolderName: string;
  lastFour: string;
  expirationDate: string;
  cvvMasked: string;
  status: 'ACTIVA' | 'BLOQUEADA' | 'CANCELADA';
  createdAt: string;
}
```

Respuesta reveal:

```ts
{
  cardNumber: string;
  cvv: string;
}
```

### Solicitar Dinero

```http
POST /money-requests
GET /money-requests/me
PATCH /money-requests/:id/respond
```

### Notificaciones

```http
GET /notifications/me
PATCH /notifications/:id/read
```

### Pagos De Servicios

```http
POST /payments
GET /payments/me
```

## Estado Por Modulo

| Modulo | Estado | Notas |
|---|---:|---|
| Usuarios/auth | Hecho base | Registro, login, logout, recuperacion y 2FA existen. Lint pendiente por `any` y reglas React. |
| Perfil | Hecho base | Edicion existe. Lint pendiente. |
| Cuentas | Hecho | Crear, listar, depositar, retirar, mostrar/ocultar saldo. |
| Transferencias | Hecho base | Buscar destinatario, transferir, comprobante, historial base. |
| Historial | Parcial | Falta saldo resultante real y filtros completos. |
| Bolsillos | Avanzado | Pull remoto agrego UI/servicios `features/pockets`; tambien existe trabajo local en `features/pocket`. Revisar duplicidad antes de ampliar. |
| Prestamos/creditos | Avanzado | Hay `LoansClient`, servicios y hooks. Falta validar UX completa contra backend. |
| Tarjetas virtuales | Avanzado | Crear/listar/bloquear/revelar numero y CVV. Falta QA manual end-to-end. |
| Solicitar dinero | Avanzado/parcial | Hay archivos locales en `features/money-request`; revisar flujo manual. |
| Notificaciones | Avanzado/parcial | Hay archivos locales en `features/notification`; falta badge/dropdown opcional y QA. |
| Pagos servicios | Pendiente/revisar | La ruta vieja `/services` fue eliminada localmente; revisar si se reemplazo o falta reconstruir pantalla. |

## Pendientes Tecnicos Importantes

### 1. Limpiar Secretos

`backend/.env.example` contiene llaves reales de Supabase, incluida `SUPABASE_SERVICE_ROLE_KEY`.

Acciones recomendadas:

1. Quitar llaves reales de `.env.example`.
2. Dejar placeholders.
3. Rotar `SERVICE_ROLE_KEY` en Supabase.
4. Confirmar que `.env` no se commitea.

### 2. Resolver Deuda De Lint Global Frontend

`npm run lint` en `frontend/` falla por errores preexistentes, principalmente:

- `frontend/src/features/account/hooks/useAccounts.ts`
- `frontend/src/features/auth/components/TwoFactorVerifyForm.tsx`
- `frontend/src/features/auth/hooks/useLogin.ts`
- `frontend/src/features/auth/hooks/usePasswordReset.ts`
- `frontend/src/features/auth/hooks/useRegister.ts`
- `frontend/src/features/auth/hooks/useTwoFactor.ts`
- `frontend/src/features/profile/hooks/useProfile.ts`
- `frontend/src/features/profile/hooks/useUpdateProfile.ts`
- `frontend/src/shared/components/ui/Label.tsx`
- `frontend/src/shared/hooks/useAuth.tsx`

Tipos de error:

- `@typescript-eslint/no-explicit-any`
- `react-hooks/set-state-in-effect`
- `@typescript-eslint/no-empty-object-type`

### 3. Revisar Duplicidad `pocket` vs `pockets`

Existen dos lineas de implementacion:

```txt
frontend/src/features/pocket/
frontend/src/features/pockets/
```

El pull remoto usa `features/pockets` para `PocketsClient`.
El trabajo local previo usa `features/pocket`.

Antes de seguir, elegir una sola convencion para no duplicar servicios/hooks.

### 4. Revisar Duplicidad `fronted` vs `frontend`

`frontend/` es la carpeta activa.
`fronted/` parece historica/duplicada y actualmente aparece con eliminaciones locales.

No recuperar archivos de `fronted/` salvo que haya algo puntual que falte migrar.

### 5. Historial: Saldo Resultante

El requisito pide saldo resultante por movimiento. Actualmente no llega desde backend.

Opciones:

1. Agregar `resultingBalance` al modelo de transacciones y devolverlo en historial.
2. Mostrar temporalmente `No disponible`, sin inventarlo en frontend.

### 6. Modelo De Credito Y Tarjeta

Decision de producto conversada:

- Nubank-like: primero se aprueba un credito/cupo.
- Luego ese cupo se puede usar mediante tarjeta virtual, avances u otros productos.
- En FuBanking actualmente la tarjeta virtual esta asociada a cuenta.

Proximo paso futuro:

- Crear relacion entre credito aprobado/cupo y tarjeta virtual.
- Definir si la tarjeta debita cuenta, cupo aprobado, o ambos segun tipo.

## Convenciones

### API Client

Usar:

```ts
import { apiClient } from '@/shared/services/api.client';
```

El interceptor devuelve el wrapper del backend. Patron actual:

```ts
const response = await apiClient.get<T>('/endpoint');
return response.data;
```

### Toasts

Usar:

```ts
import { useToast } from '@/shared/components/feedback/ToastProvider';

const toast = useToast();

toast.success('Operacion realizada', 'Detalle breve.');
toast.error('No pudimos completar la operacion', 'Detalle breve.');
```

No usar `alert()`.

### UI

- Mantener estetica banking limpia tipo Nubank/FuBanking.
- Usar `lucide-react`.
- Usar tokens existentes: `bg-card`, `border`, `foreground`, `muted`, `primary`.
- Evitar landing pages en rutas internas.
- Cada ruta debe ser una herramienta usable.
- Mobile responsive obligatorio.

## Orden Recomendado Para La Proxima Sesion

1. Probar manualmente crear tarjeta virtual y revelar numero/CVV con backend y frontend corriendo.
2. Limpiar secretos de `.env.example` y documentar rotacion de Supabase key.
3. Resolver lint global del frontend o al menos los errores mas bloqueantes.
4. Decidir `features/pocket` vs `features/pockets` y consolidar.
5. Revisar `/services`, porque aparece eliminado localmente.
6. QA de `/loans`, `/pockets`, `/requests`, `/notifications`.
7. Implementar `saldo resultante` en historial.
8. Preparar commits pequenos por modulo.

## Checklist De QA Final

```bash
cd backend
npm run build
npm run test

cd ../frontend
npm run build
npm run lint
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
- solicitar credito
- crear tarjeta virtual
- revelar numero/CVV
- ocultar numero/CVV
- bloquear/desbloquear tarjeta
- solicitar dinero
- aceptar/rechazar solicitud
- ver notificaciones
- marcar notificacion como leida
