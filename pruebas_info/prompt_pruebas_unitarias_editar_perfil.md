# Prompt: Generar pruebas unitarias de caja blanca — Editar perfil

## Contexto del proyecto

Estoy haciendo pruebas de caja blanca para la funcionalidad de **editar perfil** de mi aplicación, dividida en tres capas: backend, frontend, e integración entre ambas. Ya hice el análisis de caja blanca (diagrama de flujo, grafo de flujo y tabla de caminos) para cada capa. Ahora necesito que generes las **pruebas unitarias** correspondientes a cada camino de cada tabla.

## Requisito más importante — LÉELO PRIMERO

Las pruebas deben ser:

- **Manuales y lo más simples/básicas posible.**
- **Prohibido usar librerías o utilidades de mocking** (nada de `jest.mock`, `jest.fn()`, `sinon`, `vi.mock`, `unittest.mock`, etc.).
- Si una prueba necesita aislar una dependencia (ej. un repositorio, una llamada HTTP), no la mockees: usa un **objeto o función escrita a mano** lo más simple posible (un objeto plano, una clase mínima, una constante), o si es viable usa la dependencia real (ej. una base de datos en memoria simple, un arreglo en memoria).
- Prioriza siempre la opción más sencilla: si una prueba se puede escribir sin ningún doble de prueba, hazlo así.
- No agregues configuración, librerías nuevas, ni patrones avanzados (no builders, no factories complejas, no fixtures compartidos innecesarios). Cada prueba debe poder leerse de arriba a abajo y entenderse sin saltar a otros archivos.

## Qué necesito que generes

Para **cada camino** de las tres tablas de abajo (backend, frontend, integración), genera **una prueba unitaria** que:

1. Prepare la entrada descrita en la columna "Entrada".
2. Ejecute el código correspondiente.
3. Verifique que el resultado coincide con la columna "Salida".
4. En el nombre o comentario de la prueba, referencia el número de camino (ej. `// Camino 1: ...`) para poder trazarla de vuelta a la tabla.

Organiza la salida en tres bloques de código separados (uno por capa), cada uno como si fuera un archivo de test independiente (`profile-update.backend.test.ts`, `profile-update.frontend.test.tsx`, `profile-update.integration.test.ts` o los nombres que consideres más apropiados). Usa el framework de testing que ya se infiere del stack (TypeScript, React) — si no es evidente, usa Jest + React Testing Library por ser el más común en este stack, pero acláralo.

---

## 1. Backend — código fuente

**Controlador:** `backend/src/presentation/controllers/ProfileController.ts`
```typescript
updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dto = updateProfileSchema.parse(req.body);
    const updateDto = {
      ...dto,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : (dto.birthDate === null || dto.birthDate === '' ? null : undefined),
    };
    const result = await this.updateProfile.execute(req.user!.id, updateDto);
    sendSuccess(res, result, 'Perfil actualizado exitosamente');
  } catch (error) {
    next(error);
  }
};
```

**Caso de uso:** `backend/src/application/use-cases/profile/UpdateProfile.ts`
```typescript
if (!hasChanges) {
  throw new AppError('No se proporcionó ningún campo para actualizar', 400, 'NO_CHANGES');
}
const updatedUser = await this.userRepository.update(userId, {
  firstName: dto.firstName,
  middleName: dto.middleName,
  lastName: dto.lastName,
  secondLastName: dto.secondLastName,
  birthDate: dto.birthDate ?? undefined,
  phone: dto.phone,
  avatarUrl: dto.avatarUrl,
});
```

### Tabla de caminos — Backend

| Camino | Entrada | Prueba | Salida |
|---|---|---|---|
| 1,2,3,5,6,8,10,11,12,13,15,16,17,18 | Datos válidos, sin fecha de nacimiento, con cambios reales (ej. nuevo teléfono) | 3=No · 6=No · 8=No · 13=No | Perfil actualizado (200 OK) |
| 1,2,3,4,19,20,21 | Un dato con formato inválido (ej. teléfono como número en vez de texto) | 3=Sí | Error de validación (400) |
| 1,2,3,5,6,7,11,12,13,15,16,17,18 | Fecha de nacimiento válida junto con otros cambios | 3=No · 6=Sí · 13=No | Perfil actualizado (200 OK) |
| 1,2,3,5,6,8,9,11,12,13,15,16,17,18 | El usuario pide borrar su fecha de nacimiento (la envía como null o vacía) | 3=No · 6=No · 8=Sí · 13=No | Fecha de nacimiento eliminada (200 OK) |
| 1,2,3,5,6,8,10,11,12,13,14,19,20,21 | Datos válidos pero iguales a los que ya tenía guardados | 3=No · 6=No · 8=No · 13=Sí | No hay nada que actualizar (400) |
| 1,2,3,5,6,7,11,12,13,14,19,20,21 | Fecha de nacimiento enviada pero es la misma que ya tenía guardada | 3=No · 6=Sí · 13=Sí | No hay nada que actualizar (400) |
| 1,2,3,5,6,8,9,11,12,13,14,19,20,21 | Se pide borrar la fecha de nacimiento pero ya estaba vacía | 3=No · 6=No · 8=Sí · 13=Sí | No hay nada que actualizar (400) |

---

## 2. Frontend — código fuente

**Función `onSubmit`** del formulario de edición de perfil:
```typescript
const onSubmit = (data: UpdateProfileInput) => {
  const payload: UpdateProfileInput = {};
  if (data.firstName !== user.firstName) payload.firstName = data.firstName;
  if (data.middleName !== (user.middleName || '')) payload.middleName = data.middleName || null;
  if (data.lastName !== user.lastName) payload.lastName = data.lastName;
  if (data.secondLastName !== (user.secondLastName || '')) payload.secondLastName = data.secondLastName || null;

  const currentBirthDateStr = user.birthDate ? user.birthDate.split('T')[0] : '';
  if (data.birthDate !== currentBirthDateStr) payload.birthDate = data.birthDate || null;

  if (data.phone !== (user.phone || '')) payload.phone = data.phone || null;
  if (data.avatarUrl !== (user.avatarUrl || '')) payload.avatarUrl = data.avatarUrl || null;

  if (Object.keys(payload).length > 0) {
    handleUpdate(payload);
  } else {
    onCancel();
  }
};
```

### Tabla de caminos — Frontend

> Nota: las 7 comparaciones de campo son independientes entre sí, por lo que la tabla no enumera todas las combinaciones (2⁸), sino el conjunto base: una línea sin cambios y una por cada decisión activada de forma aislada.

| Camino | Entrada | Prueba | Salida |
|---|---|---|---|
| 1,2,3,5,7,9,11,13,14,16,18,20,22,24 | Sin modificar ningún campo (tampoco tenía fecha de nacimiento guardada) | todas=No | No se envía nada; se cancela la edición (`onCancel`) |
| 1,2,3,4,5,7,9,11,13,14,16,18,20,21,23 | Solo cambia el primer nombre | firstName cambia (resto=No) | Se llama `handleUpdate({ firstName })` |
| 1,2,3,5,6,7,9,11,13,14,16,18,20,21,23 | Solo cambia el segundo nombre | middleName cambia (resto=No) | Se llama `handleUpdate({ middleName })` |
| 1,2,3,5,7,8,9,11,13,14,16,18,20,21,23 | Solo cambia el primer apellido | lastName cambia (resto=No) | Se llama `handleUpdate({ lastName })` |
| 1,2,3,5,7,9,10,11,13,14,16,18,20,21,23 | Solo cambia el segundo apellido | secondLastName cambia (resto=No) | Se llama `handleUpdate({ secondLastName })` |
| 1,2,3,5,7,9,11,12,14,16,18,20,22,24 | Ya tenía fecha de nacimiento guardada y no la modifica (nada más cambia tampoco) | birthDate existía, no cambia | No se envía nada; se cancela la edición |
| 1,2,3,5,7,9,11,13,14,15,16,18,20,21,23 | Solo cambia la fecha de nacimiento | birthDate cambia (resto=No) | Se llama `handleUpdate({ birthDate })` |
| 1,2,3,5,7,9,11,13,14,16,17,18,20,21,23 | Solo cambia el teléfono | phone cambia (resto=No) | Se llama `handleUpdate({ phone })` |
| 1,2,3,5,7,9,11,13,14,16,18,19,20,21,23 | Solo cambia la foto de perfil | avatarUrl cambia (resto=No) | Se llama `handleUpdate({ avatarUrl })` |

---

## 3. Integración — código fuente

**Hook:** `frontend/src/features/profile/hooks/useUpdateProfile.ts`
```typescript
export function useUpdateProfile(onSuccessCallback?: (user: PublicUser) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const { login } = useAuth();

  const handleUpdate = async (data: UpdateProfileInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await profileService.updateProfile(data);
      const token = localStorage.getItem('token') || '';
      login(updatedUser, token);
      if (onSuccessCallback) {
        onSuccessCallback(updatedUser);
      }
    } catch (err: any) {
      setError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  };

  return { handleUpdate, isLoading, error };
}
```

Flujo completo: `ProfileEditForm` → `handleUpdate` (hook) → `profileService.updateProfile` → `apiClient.patch('/profile', data)` → `PATCH /api/v1/profile` → Controlador → Caso de uso → Repositorio → respuesta → hook actualiza `login()` / `onSuccessCallback` (éxito) o `setError` (error).

### Tabla de caminos — Integración

| Camino | Entrada | Prueba | Salida |
|---|---|---|---|
| 1,2,3 | El usuario da clic en "Guardar" sin modificar ningún campo del formulario | ¿hay campo modificado?=No | No se envía ninguna petición; se cancela la edición |
| 1,2,4,5,6,7,8,9,14,19,20,21,22 | El usuario modifica un campo pero lo envía con un formato inválido (ej. una fecha mal formada) | formato inválido=Sí → éxito=No | El formulario muestra el error de validación; el perfil no cambia |
| 1,2,4,5,6,7,8,10,11,12,14,19,20,21,22 | El usuario "modifica" un campo pero el valor final es igual al que ya tenía guardado; el backend no detecta cambios reales | formato inválido=No → sin cambios reales=Sí → éxito=No | El formulario muestra "No se proporcionó ningún campo para actualizar"; el perfil no cambia |
| 1,2,4,5,6,7,8,10,11,13,14,15,16,17,18 | El usuario modifica al menos un campo con un valor válido y distinto al actual | formato inválido=No → sin cambios reales=No → éxito=Sí | El perfil se actualiza en la BD, se sincroniza el estado global de autenticación (`login`) y el usuario ve la confirmación |

---

## Formato de salida esperado

```
### Backend (profile-update.backend.test.ts)
[código de las 7 pruebas, una por camino]

### Frontend (profile-update.frontend.test.tsx)
[código de las 9 pruebas, una por camino]

### Integración (profile-update.integration.test.ts)
[código de las 4 pruebas, una por camino]
```

Recuerda: **sin mocks, sin librerías de mocking, lo más simple y manual posible.** Si para alguna prueba no ves forma de evitar un doble de prueba, usa un objeto/función escrita a mano (no una librería) y explica brevemente por qué fue necesario.
