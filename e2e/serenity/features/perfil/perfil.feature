# language: es
Requisito: Edición de Perfil

  Para mantener mi información actualizada
  Como cliente del banco
  Quiero poder editar los datos de mi perfil personal

  # ─── Flujo exitoso ──────────────────────────────────────────────────────────

  @api @perfil
  Escenario: Actualizar nombre exitosamente
    Dado Ana es clienta con una cuenta de ahorros con saldo de 0
    Cuando ella actualiza su perfil con nombre "Ana María" y apellido "García"
    Entonces la respuesta HTTP tiene estado 200

  # ─── Validaciones de campos ─────────────────────────────────────────────────

  @api @perfil @validaciones
  Escenario: Actualizar perfil con nombre vacío
    Dado Ana es clienta con una cuenta de ahorros con saldo de 0
    Cuando ella actualiza su perfil con nombre "" y apellido "García"
    Entonces la respuesta HTTP tiene estado 400

  @api @perfil @validaciones
  Escenario: Actualizar perfil con apellido vacío
    Dado Ana es clienta con una cuenta de ahorros con saldo de 0
    Cuando ella actualiza su perfil con nombre "Ana" y apellido ""
    Entonces la respuesta HTTP tiene estado 400

  # ─── Seguridad ──────────────────────────────────────────────────────────────

  @api @perfil @validaciones
  Escenario: Actualizar perfil sin autenticación
    Cuando alguien intenta actualizar un perfil sin token de sesión
    Entonces la respuesta HTTP tiene estado 401
