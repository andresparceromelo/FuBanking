@deposito
Feature: Depositar dinero en la cuenta
  Como cliente de FuBanking
  Quiero abonar dinero a mi cuenta
  Para tener saldo disponible para mis bolsillos

  Background:
    Given Carlos es cliente con una cuenta de ahorros con saldo de 0

  @api @smoke
  Scenario: Depositar un monto válido
    When él deposita por API 250000 en su cuenta con la descripción "Ahorro mensual"
    Then la respuesta HTTP tiene estado 200
    And el saldo de su cuenta es 250000

  @api
  Scenario: Los depósitos se acumulan en el saldo
    When él deposita por API 100000 en su cuenta
    And él deposita por API 50000 en su cuenta
    Then el saldo de su cuenta es 150000

  @api
  Scenario Outline: Rechazar un depósito de <monto>
    When él deposita por API <monto> en su cuenta
    Then la respuesta HTTP tiene estado 400
    And el código de error es "INVALID_AMOUNT"
    And el saldo de su cuenta es 0

    Examples:
      | monto  |
      | 0      |
      | -50000 |

  @api @seguridad
  Scenario Outline: Rechazar un monto que no es un número (<valor>)
    When él deposita por API el valor JSON <valor> en su cuenta
    Then la respuesta HTTP tiene estado 400
    And el código de error es "INVALID_AMOUNT"
    And el saldo de su cuenta es 0

    Examples:
      | valor  |
      | true   |
      | "abc"  |
      | null   |
      | [1000] |

  @api @seguridad
  Scenario: No se puede depositar en la cuenta de otro cliente
    Given Diana es clienta con una cuenta de ahorros con saldo de 100000
    When Carlos deposita por API 50000 en la cuenta de Diana
    Then la respuesta HTTP tiene estado 403
    And el código de error es "FORBIDDEN"
    And el saldo de la cuenta de Diana es 100000

  @web @smoke
  Scenario: Abonar saldo desde la pantalla de cuentas
    Given él está en la pantalla de cuentas
    When él abona 150000 a su cuenta
    Then él ve la notificación "Deposito realizado"
    And él ve el saldo de su cuenta en 150000
    And el saldo de su cuenta es 150000

  @web
  Scenario: El formulario de abono rechaza un monto en cero
    Given él está en la pantalla de cuentas
    When él abona 0 a su cuenta
    Then él ve el error del formulario "Por favor ingresa un monto válido mayor a cero."
    And el saldo de su cuenta es 0
