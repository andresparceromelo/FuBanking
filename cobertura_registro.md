Backend:
Archivo analizado: RegisterUser.ts

Al ejecutar RegisterUser.test.ts y RegisterUser.integration.test.ts se obtuvieron 25 líneas evaluables, de las cuales 25 fueron ejecutadas por las pruebas. Al tratarse de pruebas que cubren tanto caminos unitarios como el flujo de integración principal, todas las ramas lógicas y excepciones están contempladas. El cálculo resultante es:

Cobertura (%) = (25 / 25) × 100 = 100%


Frontend:
Archivos analizados: RegisterForm.tsx, useRegister.ts

Al ejecutar RegisterForm.test.tsx se obtuvieron 19 líneas evaluables en RegisterForm.tsx, de las cuales 16 fueron ejecutadas. Las 3 líneas no cubiertas corresponden al bloque del manejador de envío (línea 40) y a los manejadores onClick que alternan la visibilidad de las contraseñas (líneas 148 y 168), interacciones que no fueron simuladas en esta prueba básica de renderizado. El cálculo resultante es:

Cobertura (%) = (16 / 19) × 100 = 84.21%


Integración:
Archivos analizados: RegisterForm.tsx, useRegister.ts

La prueba unitaria evalúa el renderizado inicial y la inyección del hook, pero al no simular el envío del formulario, la función interna del hook no se ejecuta.

A. Componente RegisterForm.tsx
Se obtuvieron 19 líneas evaluables, de las cuales 16 fueron ejecutadas.
Cobertura (%) = (16 / 19) × 100 = 84.21%

B. Hook useRegister.ts
Se obtuvieron 16 líneas evaluables, de las cuales 9 fueron ejecutadas. Las 7 líneas no cubiertas corresponden a la ejecución interna de handleRegister (líneas 13-21) dado que el formulario no fue enviado en la prueba.
Cobertura (%) = (9 / 16) × 100 = 56.25%

Cobertura integrada de la capa
Considerando el total de líneas ejecutadas y evaluables de ambos archivos en conjunto:
Total de líneas ejecutadas = 16 (UI) + 9 (lógica) = 25
Total de líneas evaluables = 19 (UI) + 16 (lógica) = 35
Cobertura integrada (%) = (25 / 35) × 100 = 71.42%
