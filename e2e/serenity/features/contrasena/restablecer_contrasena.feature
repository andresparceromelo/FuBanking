# language: es
Requisito: Restablecimiento de Contraseña

  Para recuperar el acceso a mi cuenta
  Como cliente que olvidó su contraseña
  Quiero poder restablecerla de forma segura

  # ─── Solicitud de restablecimiento ────────────────────────────────────────

  @api @contrasena
  Escenario: Solicitar restablecimiento con email existente
    Dado Ana es clienta con una cuenta de ahorros con saldo de 0
    Cuando ella solicita restablecer la contraseña con su email
    Entonces la respuesta HTTP tiene estado 200

  @api @contrasena @validaciones
  Escenario: Solicitar restablecimiento con email no registrado
    Cuando alguien solicita restablecer la contraseña del email "fantasma@fubanking.test"
    Entonces la respuesta HTTP tiene estado 200

  @api @contrasena @validaciones
  Escenario: Solicitar restablecimiento con email con formato inválido
    Cuando alguien solicita restablecer la contraseña del email "esto-no-es-un-email"
    Entonces la respuesta HTTP tiene estado 400

  # ─── Verificación de token ─────────────────────────────────────────────────

  @api @contrasena @validaciones
  Escenario: Verificar token de restablecimiento inválido
    Cuando alguien verifica el token de restablecimiento "token-falso-12345"
    Entonces la respuesta HTTP tiene estado 401

  @api @contrasena @validaciones
  Escenario: Verificar token de restablecimiento vacío
    Cuando alguien verifica el token de restablecimiento ""
    Entonces la respuesta HTTP tiene estado 400

  # ─── Restablecimiento de contraseña ────────────────────────────────────────

  @api @contrasena @validaciones
  Escenario: Restablecer contraseña con token inválido
    Cuando alguien intenta restablecer la contraseña con token "token-falso" y nueva contraseña "NuevaClave123!"
    Entonces la respuesta HTTP tiene estado 401

  @api @contrasena @validaciones
  Escenario: Restablecer contraseña con contraseña débil
    Cuando alguien intenta restablecer la contraseña con token "token-falso" y nueva contraseña "1234"
    Entonces la respuesta HTTP tiene estado 400

  @api @contrasena @validaciones
  Escenario: Restablecer contraseña con contraseñas que no coinciden
    Cuando alguien intenta restablecer la contraseña con token "token-falso", nueva contraseña "NuevaClave123!" y confirmación "OtraClave456!"
    Entonces la respuesta HTTP tiene estado 400
