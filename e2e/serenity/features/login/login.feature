# language: es
Requisito: Autenticación de Usuarios

  Para acceder de forma segura a mis finanzas
  Como cliente registrado del banco
  Quiero poder iniciar sesión con mis credenciales

  # ─── Flujo exitoso ──────────────────────────────────────────────────────────

  @api @login
  Escenario: Inicio de sesión exitoso
    Dado Ana es clienta con una cuenta de ahorros con saldo de 0
    Cuando ella inicia sesión con sus credenciales correctas
    Entonces la respuesta HTTP tiene estado 200
    Y la respuesta contiene un token de sesión

  # ─── Validaciones de credenciales ───────────────────────────────────────────

  @api @login @validaciones
  Escenario: Inicio de sesión con contraseña incorrecta
    Dado Ana es clienta con una cuenta de ahorros con saldo de 0
    Cuando ella intenta iniciar sesión con la contraseña "claveIncorrecta123!"
    Entonces la respuesta HTTP tiene estado 401

  @api @login @validaciones
  Escenario: Inicio de sesión con email no registrado
    Cuando alguien intenta iniciar sesión con el email "noexiste@fubanking.test" y contraseña "Clave123!"
    Entonces la respuesta HTTP tiene estado 401

  @api @login @validaciones
  Escenario: Inicio de sesión con campos vacíos
    Cuando alguien intenta iniciar sesión con el email "" y contraseña ""
    Entonces la respuesta HTTP tiene estado 400
