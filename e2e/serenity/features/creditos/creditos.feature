# language: es
@web @loans
Característica: Gestión y Simulación de Créditos Bancarios
  Como cliente de FuBanking
  Quiero simular cuotas de préstamo y gestionar solicitudes de crédito
  Para tomar decisiones financieras informadas con transparencia

  @smoke
  Escenario: Simulación exitosa de crédito con cálculo de cuota mensual
    Dado que Gabriel abre la plataforma FuBanking
    Y él ingresa al simulador de créditos
    Cuando él simula un préstamo con monto "5000", cuotas "12" y tasa "18"
    Entonces él observa el resultado de la simulación
    Y él confirma que la simulación está lista

  Escenario: Simulación con límites y valores de frontera
    Dado que Gabriel abre la plataforma FuBanking
    Y él ingresa al simulador de créditos
    Cuando él simula un préstamo con monto "25000000", cuotas "36" y tasa "24"
    Entonces él observa el resultado de la simulación
    Y él confirma que la simulación está lista

  Escenario: Validación preventiva ante montos y cuotas en cero
    Dado que Gabriel abre la plataforma FuBanking
    Y él ingresa al simulador de créditos
    Cuando él simula un préstamo con monto "0", cuotas "0" y tasa "18"
    Entonces él observa un mensaje de validación en pantalla

  Escenario: Verificación de requisitos de elegibilidad de perfil
    Dado que Gabriel abre la plataforma FuBanking
    Y él ingresa al simulador de créditos
    Entonces él observa los requisitos para solicitar crédito en pantalla
    Y él visualiza el botón de solicitar crédito disponible

  Escenario: Inspección de contenedores informativos y resumen de crédito
    Dado que Gabriel abre la plataforma FuBanking
    Y él ingresa al simulador de créditos
    Entonces él observa el panel de resumen del préstamo

  Escenario: Envío de solicitud de crédito por el cliente Gabriel
    Dado que Gabriel abre la plataforma FuBanking
    Y él ingresa al simulador de créditos
    Cuando él simula un préstamo con monto "5000", cuotas "12" y tasa "18"
    Y él intenta enviar la solicitud de crédito
    Entonces él confirma que la solicitud fue enviada

  @admin @golden
  Escenario: Aprobación de crédito por el Administrador Andresito
    Dado que Andresito abre la plataforma FuBanking
    Y él ingresa al panel de administración de créditos
    Cuando él aprueba la solicitud de crédito pendiente
    Entonces él observa el estado "Aprobado" en la solicitud
