@bolsillos
Feature: Consultar bolsillos
  Como clienta de FuBanking
  Quiero ver los bolsillos de mi cuenta
  Para saber cuánto tengo apartado en cada uno

  Background:
    Given Ana es clienta con una cuenta de ahorros con saldo de 500000

  @api @smoke
  Scenario: Consultar los bolsillos de la cuenta
    Given ella tiene los bolsillos:
      | nombre     | monto  |
      | Vacaciones | 100000 |
      | Mercado    | 50000  |
    When ella consulta por API los bolsillos de su cuenta
    Then la respuesta HTTP tiene estado 200
    And la respuesta contiene 2 bolsillos

  @api
  Scenario: Una cuenta sin bolsillos devuelve una lista vacía
    When ella consulta por API los bolsillos de su cuenta
    Then la respuesta HTTP tiene estado 200
    And la respuesta contiene 0 bolsillos

  @api @seguridad
  Scenario: No se pueden consultar los bolsillos de otro cliente
    Given Bruno es cliente con una cuenta de ahorros con saldo de 100000
    When Ana consulta por API los bolsillos de la cuenta de Bruno
    Then la respuesta HTTP tiene estado 403
    And el código de error es "FORBIDDEN"

  @web
  Scenario: Ver en pantalla los bolsillos de la cuenta
    Given ella tiene los bolsillos:
      | nombre     | monto  |
      | Vacaciones | 100000 |
      | Mercado    | 50000  |
    And ella inició sesión en FuBanking
    When ella abre la pantalla de bolsillos
    Then ella ve los bolsillos:
      | Vacaciones |
      | Mercado    |
    And ella ve el bolsillo "Vacaciones" con 100000
    And ella ve el bolsillo "Mercado" con 50000
