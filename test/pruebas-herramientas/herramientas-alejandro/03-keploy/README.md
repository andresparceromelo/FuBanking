# Keploy — Casos de prueba y mocks a partir del tráfico real

**Keploy** intercepta con eBPF las llamadas que recibe la API y las que ella hace hacia afuera:

- cada request/response real se convierte en un **caso de prueba** (`keploy/test-set-*/tests/*.yaml`);
- cada llamada a una dependencia (Supabase por HTTPS) se convierte en un **mock** (`mocks.yaml`);
- al reproducir (`keploy test`), la API corre con los mocks, **sin base de datos**, y Keploy compara las
  respuestas. Los campos que cambian solos (ids, JWT, `Etag`) se declaran como **ruido**.

## Flujo en FuBanking

```txt
Newman (colección de la herramienta 2) ──► backend :3101 (bajo keploy record) ──► Supabase (HTTPS)
                                                   └─► 50 casos + 95 mocks de Supabase
keploy test ──► backend con mocks ──► compara las 50 respuestas (Supabase no se toca)
```

La colección de Postman genera el tráfico: las herramientas 2 y 3 se alimentan entre sí.

## Por qué en Docker

El binario de Keploy para Windows (`enterprise_windows_amd64.exe`) lo **bloqueó Windows Defender**
como "software potencialmente no deseado"; se borró sin ejecutarlo. Se usó entonces la imagen oficial
`ghcr.io/keploy/keploy` (Linux). Ese binario no trae cliente de Docker, así que el `Dockerfile` de esta
carpeta lo junta con el backend compilado en una sola imagen (`fubank-keploy`). El contenedor corre con
`--privileged` porque eBPF lo necesita.

## Uso

```powershell
# Grabar (backend bajo Keploy en :3101 + Newman generando el tráfico)
powershell -File test/pruebas-herramientas/herramientas-alejandro/03-keploy/keploy.ps1 record

# Reproducir con los mocks
npm run test:keploy:bolsillos
```

`keploy.yml` declara el ruido. `data.token` es el JWT nuevo (cambia el `iat`). `data.id` es el id de bolsillo,
que genera la app con `randomUUID` porque los bolsillos viven en memoria (defecto D-07). `Etag` depende de
los dos.

## Resultados (2026-10-26)

| Paso | Resultado |
|---|---|
| Grabación | 50 casos (49 requests de la colección + `/health`) y **95 mocks HTTPS de Supabase** + 1 DNS. Newman a través de Keploy: 136/136 aserciones |
| 1.ª reproducción (sin ruido declarado) | **45 / 50**. Fallan 2 registros y 3 creaciones de bolsillo, solo por `data.token`, `data.id` y `Etag` |
| 2.ª reproducción (con ruido) | **50 / 50 en 13,6 s**, sin conexión a Supabase |

**Hallazgo.** La reproducción mostró que el id de los bolsillos **no viene de la base de datos**: lo genera
la app. Es una confirmación independiente del defecto D-07 (la tabla `pockets` no existe en Supabase y se
usa un `Map` en memoria).

## Seguridad de la evidencia

Los mocks grabados guardan los encabezados reales hacia Supabase, **incluida la `service_role`**. Por eso
`keploy/` y `keploy-logs.txt` están en `.gitignore`. Lo que se versiona está en `evidence/`:

| Archivo | Contenido |
|---|---|
| `evidence/test-set-0-saneado/` | Los 50 casos y los mocks con JWT, `service_role`, contraseñas y cookies **redactados** |
| `evidence/01-replay-sin-ruido-45-de-50.txt` | 1.ª reproducción con los diffs de los 5 casos |
| `evidence/02-replay-con-ruido-50-de-50.txt` | 2.ª reproducción, 50/50 |

## Aportes y limitaciones

- **Aporta:** regresión de la API sin depender de Supabase (13 s, repetible y sin datos que limpiar). Los
  casos salen del tráfico real, sin escribirlos.
- **Limita:** necesita Linux/eBPF y privilegios. Los mocks capturan secretos y hay que sanearlos. El ruido se
  configura a mano: si se declara de más, se ocultan defectos reales.
