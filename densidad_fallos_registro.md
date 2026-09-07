-Densidad de Fallos:
Archivos evaluados (Total Funcionalidad de Registro):
Backend: RegisterUser.ts (83 líneas)
Frontend: RegisterForm.tsx (192 líneas)
Frontend: useRegister.ts (32 líneas)
Frontend: auth.schemas.ts (42 líneas)

Total de Líneas de Código (LoC): 349 líneas.
KLoC (Miles de líneas): 0.349 KLoC.

Durante la ejecución y validación de las pruebas, se detectaron los siguientes 7 defectos en el flujo de registro de usuarios:
1. No existen advertencias ni retroalimentación de seguridad visual al ingresar contraseñas débiles.
2. El campo de contraseña carece de un límite máximo de caracteres establecido.
3. El sistema permite el ingreso de nombres y apellidos sin sentido o caracteres repetidos consecutivamente (como `xxxxx` o `aaaaaa`).
4. Existe un problema de desfase en la fecha de nacimiento: al momento de guardarla en la información del perfil, se guarda o visualiza con un día anterior al seleccionado (frecuentemente causado por el manejo de zonas horarias en UTC).
5. En el frontend no existe un límite de longitud de caracteres para los inputs generales, permitiendo al usuario ingresar una cantidad excesiva de texto sin restricciones locales, aunque posteriormente sea procesado o rechazado.
6. Si un usuario hace clic de forma múltiple y muy rápida (doble clic) en el botón de "Abrir cuenta", el cliente llega a despachar varias peticiones de registro de manera simultánea antes de que el estado `isLoading` logre bloquear el botón en el DOM, provocando respuestas redundantes o errores de conflicto 409.
7. El selector de la fecha de nacimiento carece de límites cronológicos, permitiendo seleccionar años irreales (muy antiguos) o años excesivamente recientes (incluyendo el actual).

 A. Cálculo por Total de Líneas Exactas (LoC)
 Densidad = Defectos / Total de líneas
 Densidad = 7 / 349
Resultado: 0.0200 defectos por línea de código (Aproximadamente 2 defectos por cada 100 líneas escritas).

 B. Cálculo Estándar por Miles de Líneas (KLoC)
 Densidad = Defectos / KLoC
 Densidad = 7 / 0.349
Resultado: 20.05 defectos por KLoC
