@bolsillos
Feature: Crear bolsillo
  Como clienta de FuBanking
  Quiero apartar parte de mi saldo en un bolsillo
  Para organizar mis ahorros por objetivo

  Background:
    Given Ana es clienta con una cuenta de ahorros con saldo de 500000

  @api @smoke
  Scenario: Crear un bolsillo descuenta el monto del saldo de la cuenta
    When ella crea por API el bolsillo "Vacaciones" con 100000
    Then la respuesta HTTP tiene estado 201
    And el saldo de su cuenta es 400000

  @api
  Scenario: Se puede apartar todo el saldo disponible
    When ella crea por API el bolsillo "Carro" con 500000
    Then la respuesta HTTP tiene estado 201
    And el saldo de su cuenta es 0

  @api
  Scenario Outline: Rechazar un bolsillo con <caso>
    When ella crea por API el bolsillo "<nombre>" con <monto>
    Then la respuesta HTTP tiene estado 400
    And el código de error es "<código>"
    And el saldo de su cuenta es 500000

    Examples:
      | caso                 | nombre | monto  | código                         |
      | nombre vacío         |        | 1000   | VALIDATION_ERROR               |
      | monto negativo       | Carro  | -1000  | VALIDATION_ERROR               |
      | monto mayor al saldo | Carro  | 500001 | INSUFFICIENT_AVAILABLE_BALANCE |

  @web @smoke
  Scenario: Crear un bolsillo desde la pantalla de bolsillos
    Given ella está en la pantalla de bolsillos
    When ella crea el bolsillo "Vacaciones" con 100000
    Then ella ve la notificación "Bolsillo creado"
    And ella ve el bolsillo "Vacaciones" con 100000
    And el saldo de su cuenta es 400000

  @web
  Scenario: La pantalla pide el nombre antes de crear el bolsillo
    Given ella está en la pantalla de bolsillos
    When ella crea el bolsillo "" con 1000
    Then ella ve la notificación "Falta información"
    And el saldo de su cuenta es 500000
