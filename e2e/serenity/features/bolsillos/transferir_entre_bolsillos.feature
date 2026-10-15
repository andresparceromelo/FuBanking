@bolsillos
Feature: Transferir entre bolsillos
  Como clienta de FuBanking
  Quiero mover dinero de un bolsillo a otro
  Para reorganizar mis ahorros sin tocar el saldo de la cuenta

  Background:
    Given Ana es clienta con una cuenta de ahorros con saldo de 500000
    And ella tiene los bolsillos:
      | nombre     | monto  |
      | Vacaciones | 100000 |
      | Mercado    | 50000  |

  @api @smoke
  Scenario: Mover dinero de un bolsillo a otro
    When ella transfiere por API 30000 del bolsillo "Vacaciones" al bolsillo "Mercado"
    Then la respuesta HTTP tiene estado 200
    And su bolsillo "Vacaciones" tiene 70000
    And su bolsillo "Mercado" tiene 80000
    And el saldo de su cuenta es 350000

  @api
  Scenario: Se puede transferir todo el saldo de un bolsillo
    When ella transfiere por API 100000 del bolsillo "Vacaciones" al bolsillo "Mercado"
    Then la respuesta HTTP tiene estado 200
    And su bolsillo "Vacaciones" tiene 0
    And su bolsillo "Mercado" tiene 150000

  @api
  Scenario: No se puede transferir más de lo que tiene el bolsillo de origen
    When ella transfiere por API 100001 del bolsillo "Vacaciones" al bolsillo "Mercado"
    Then la respuesta HTTP tiene estado 400
    And el código de error es "INSUFFICIENT_POCKET_BALANCE"
    And su bolsillo "Vacaciones" tiene 100000

  @api
  Scenario: El bolsillo de origen y el de destino deben ser diferentes
    When ella transfiere por API 10000 del bolsillo "Vacaciones" al bolsillo "Vacaciones"
    Then la respuesta HTTP tiene estado 400
    And el código de error es "INVALID_TRANSFER_TARGET"

  @web
  Scenario: Transferir entre bolsillos desde la pantalla
    Given ella está en la pantalla de bolsillos
    When ella transfiere 30000 del bolsillo "Vacaciones" al bolsillo "Mercado"
    Then ella ve la notificación "Transferencia realizada"
    And ella ve el bolsillo "Vacaciones" con 70000
    And ella ve el bolsillo "Mercado" con 80000
