# language: es
Requisito: Registro de Usuarios

  Para comenzar a usar los servicios del banco
  Como persona interesada
  Quiero poder registrarme como nuevo cliente

  # ─── Flujo exitoso ──────────────────────────────────────────────────────────

  @api @registro
  Escenario: Registro exitoso de nuevo usuario
    Cuando un nuevo usuario se registra con datos válidos
    Entonces la respuesta HTTP tiene estado 201
    Y la respuesta contiene un token de sesión

  # ─── Validaciones de datos ──────────────────────────────────────────────────

  @api @registro @validaciones
  Escenario: Registro con email ya existente
    Dado Ana es clienta con una cuenta de ahorros con saldo de 0
    Cuando alguien intenta registrarse con el email de Ana
    Entonces la respuesta HTTP tiene estado 401

  @api @registro @validaciones
  Escenario: Registro con contraseña débil
    Cuando un nuevo usuario se registra con la contraseña "1234"
    Entonces la respuesta HTTP tiene estado 400

  @api @registro @validaciones
  Escenario: Registro con email inválido
    Cuando un nuevo usuario se registra con el email "esto-no-es-un-email"
    Entonces la respuesta HTTP tiene estado 400
