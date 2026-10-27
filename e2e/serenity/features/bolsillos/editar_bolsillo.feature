@bolsillos
Feature: Editar bolsillo
  Como clienta de FuBanking
  Quiero cambiar el nombre o el monto de un bolsillo
  Para ajustar mis ahorros cuando cambian mis planes

  Background:
    Given Ana es clienta con una cuenta de ahorros con saldo de 500000
    And ella tiene el bolsillo "Vacaciones" con 100000

  @api @smoke
  Scenario: Renombrar un bolsillo conserva su saldo
    When ella renombra por API el bolsillo "Vacaciones" a "Viaje a Cartagena"
    Then la respuesta HTTP tiene estado 200
    And su bolsillo "Viaje a Cartagena" tiene 100000

  @api
  Scenario: Aumentar el monto de un bolsillo descuenta la diferencia de la cuenta
    When ella ajusta por API el monto del bolsillo "Vacaciones" a 150000
    Then la respuesta HTTP tiene estado 200
    And su bolsillo "Vacaciones" tiene 150000
    And el saldo de su cuenta es 350000

  @api
  Scenario: Disminuir el monto de un bolsillo devuelve la diferencia a la cuenta
    When ella ajusta por API el monto del bolsillo "Vacaciones" a 40000
    Then la respuesta HTTP tiene estado 200
    And su bolsillo "Vacaciones" tiene 40000
    And el saldo de su cuenta es 460000

  @api
  Scenario: No se puede ajustar un bolsillo por encima del dinero total
    When ella ajusta por API el monto del bolsillo "Vacaciones" a 500001
    Then la respuesta HTTP tiene estado 400
    And el código de error es "INSUFFICIENT_AVAILABLE_BALANCE"
    And el saldo de su cuenta es 400000

  @web
  Scenario: Renombrar un bolsillo desde la pantalla
    Given ella está en la pantalla de bolsillos
    When ella renombra el bolsillo "Vacaciones" a "Viaje a Cartagena"
    Then ella ve la notificación "Bolsillo actualizado"
    And ella ve el bolsillo "Viaje a Cartagena" con 100000
