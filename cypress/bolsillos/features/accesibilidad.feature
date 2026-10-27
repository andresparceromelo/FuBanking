@bolsillos @deposito @accesibilidad
Feature: Accesibilidad de Bolsillos y Depositar
  Como clienta que usa lector de pantalla o solo teclado
  Quiero que las pantallas de bolsillos y cuentas cumplan WCAG 2.1 AA
  Para poder ahorrar sin barreras

  Solo se aceptan violaciones de impacto "moderate" o "minor"; las "serious" y
  "critical" de axe-core hacen fallar el escenario. Con un modal abierto se
  evalúa el diálogo (role="dialog", aria-modal): lo que queda detrás del velo
  está inactivo y su contraste se evalúa sin velo en el primer escenario.

  Background:
    Given Ana es clienta con una cuenta de ahorros con saldo de 500000
    And ella tiene el bolsillo "Vacaciones" con 100000

  @web
  Scenario: La pantalla de bolsillos no tiene violaciones graves de accesibilidad
    Given ella está en la pantalla de bolsillos
    Then la pantalla no tiene violaciones de accesibilidad graves

  @web
  Scenario: El diálogo para eliminar un bolsillo es accesible
    Given ella está en la pantalla de bolsillos
    When ella abre la confirmación para eliminar el bolsillo "Vacaciones"
    Then el diálogo no tiene violaciones de accesibilidad graves

  @web
  Scenario: La pantalla de cuentas no tiene violaciones graves de accesibilidad
    Given ella está en la pantalla de cuentas
    Then la pantalla no tiene violaciones de accesibilidad graves

  @web
  Scenario: El modal para abonar a la cuenta es accesible
    Given ella está en la pantalla de cuentas
    When ella abre el formulario para abonar a su cuenta
    Then el diálogo no tiene violaciones de accesibilidad graves
    And la pantalla no tiene violaciones de accesibilidad graves fuera de los diálogos
