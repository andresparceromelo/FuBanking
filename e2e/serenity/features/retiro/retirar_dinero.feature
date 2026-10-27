# language: es
Requisito: Retiro de Dinero

  Para poder utilizar el dinero de mi cuenta bancaria
  Como cliente del banco
  Quiero poder retirar fondos de mi cuenta principal

  # ─── Flujo exitoso ──────────────────────────────────────────────────────────

  @api @retiros
  Escenario: Retirar un monto válido
    Dado Ana es clienta con una cuenta de ahorros con saldo de 100000
    Cuando ella retira por API 20000 de su cuenta
    Entonces la respuesta HTTP tiene estado 200
    Y el saldo de su cuenta es 80000

  # ─── Validaciones de monto ──────────────────────────────────────────────────

  @api @retiros @validaciones
  Escenario: Intentar retirar un monto negativo
    Dado Ana es clienta con una cuenta de ahorros con saldo de 100000
    Cuando ella retira por API -50000 de su cuenta
    Entonces la respuesta HTTP tiene estado 400
    Y el código de error es "INVALID_AMOUNT"

  @api @retiros @validaciones
  Escenario: Intentar retirar cero
    Dado Ana es clienta con una cuenta de ahorros con saldo de 100000
    Cuando ella retira por API 0 de su cuenta
    Entonces la respuesta HTTP tiene estado 400
    Y el código de error es "INVALID_AMOUNT"

  @api @retiros @validaciones
  Escenario: Intentar retirar más del saldo disponible
    Dado Ana es clienta con una cuenta de ahorros con saldo de 50000
    Cuando ella retira por API 200000 de su cuenta
    Entonces la respuesta HTTP tiene estado 400
    Y el código de error es "INSUFFICIENT_FUNDS"

  # ─── Seguridad y permisos ───────────────────────────────────────────────────

  @api @retiros @validaciones
  Escenario: Intentar retirar sin autenticación
    Cuando alguien intenta retirar por API 10000 sin autenticación
    Entonces la respuesta HTTP tiene estado 401

  @api @retiros @validaciones
  Escenario: Intentar retirar de una cuenta inexistente
    Dado Ana es clienta con una cuenta de ahorros con saldo de 100000
    Cuando ella intenta retirar por API 20000 de una cuenta inexistente
    Entonces la respuesta HTTP tiene estado 404
    Y el código de error es "ACCOUNT_NOT_FOUND"
