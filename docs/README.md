# Docs FuBanking

Fuente canónica siempre `.md`. Binarios van a `_archive/`.

```txt
docs/
  README.md                  # este índice
  api/endpoints.md           # endpoints backend (base /api/v1)
  estado-fase-actual.md      # bitácora temporal: qué está hecho / pendiente
  ux/toasts-y-estilos.md     # toasts, tokens, reglas visuales
  ops/sonar.md               # análisis SonarQube (host, token, lcov)
  qa/                        # entrega-testing-creditos.md, plan-de-pruebas-ux-fubank-v2.md (APA v7), serenity-screenplay-creditos.md, katalon-e2e-creditos.md
  plan-de-pruebas*.md, pruebas-*.md, informe-*.md, registro-*.md/.json
                             # evidencia bolsillos (fuente .md)
  refactorizacion-bolsillos-antes-despues.md   # R-01…R-11: hallazgo → antes/después → verificación
  matriz-trazabilidad-bolsillos.md             # resumen; libro completo en _archive/matriz-trazabilidad-bolsillos.xlsx
  matriz-trazabilidad-equipo.md                # todo el equipo; libro completo en _archive/matriz-trazabilidad-equipo.xlsx
  evidencia-final-equipo/                      # corrida del 2026-10-26: Serenity (todas las features), Cypress de Créditos, Vitest back/front
  evidencia-cypress-bolsillos/                 # Cypress + Gherkin: corrida antes/después de accesibilidad
  evidencia-final-bolsillos/                   # Serenity, Vitest (regresión, seguridad, performance) de la corrida final
  _archive/                  # .docx/.pdf/.xlsx/.html/.drawio.xml (no editar)
```
