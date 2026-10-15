@bolsillos
Feature: Eliminar bolsillo
  Como clienta de FuBanking
  Quiero eliminar un bolsillo que ya no uso
  Para que su dinero vuelva a mi cuenta

  Background:
    Given Ana es clienta con una cuenta de ahorros con saldo de 500000
    And ella tiene el bolsillo "Vacaciones" con 100000

  @api @smoke
  Scenario: Eliminar un bolsillo devuelve su saldo a la cuenta
    When ella elimina por API el bolsillo "Vacaciones"
    Then la respuesta HTTP tiene estado 200
    And el saldo de su cuenta es 500000
    And su cuenta no tiene bolsillos

  @api @seguridad
  Scenario: No se puede eliminar el bolsillo de otro cliente
    Given Bruno es cliente con una cuenta de ahorros con saldo de 100000
    And él tiene el bolsillo "Moto" con 50000
    When Ana elimina por API el bolsillo "Moto" de Bruno
    Then la respuesta HTTP tiene estado 403
    And el código de error es "FORBIDDEN"
    And el saldo de la cuenta de Bruno es 50000

  @web @smoke
  Scenario: Eliminar un bolsillo desde la pantalla con confirmación
    Given ella está en la pantalla de bolsillos
    When ella elimina el bolsillo "Vacaciones"
    Then ella ve la notificación "Bolsillo eliminado"
    And ella ve que su cuenta no tiene bolsillos
    And el saldo de su cuenta es 500000
