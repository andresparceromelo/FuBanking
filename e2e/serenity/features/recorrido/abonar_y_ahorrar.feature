@web @bolsillos @deposito
Feature: Recorrido completo de ahorro
  Como cliente nuevo de FuBanking
  Quiero abonar dinero y apartar una parte en un bolsillo
  Para empezar a ahorrar desde la aplicación

  @smoke
  Scenario: Abonar a la cuenta y apartar una parte en un bolsillo nuevo
    Given Carlos es cliente con una cuenta de ahorros con saldo de 0
    And él está en la pantalla de cuentas
    When él abona 200000 a su cuenta
    Then él ve el saldo de su cuenta en 200000
    When él abre la pantalla de bolsillos
    And él crea el bolsillo "Emergencias" con 50000
    Then él ve el bolsillo "Emergencias" con 50000
    And el saldo de su cuenta es 150000
