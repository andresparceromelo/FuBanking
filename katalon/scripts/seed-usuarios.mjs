#!/usr/bin/env node
/**
 * Prepara los usuarios estáticos que usan las pruebas de Katalon Recorder.
 *
 * Igual que el ejemplo del profesor (usuario fijo `tomsmith`), los casos de
 * prueba escriben siempre el mismo correo y contraseña. Este script deja esos
 * usuarios listos contra el backend local y se puede correr cuantas veces se
 * quiera (es idempotente):
 *
 *   1. Inicia sesión; si el usuario no existe, lo registra (sin 2FA).
 *   2. Si no tiene cuenta de ahorros activa, la abre.
 *   3. Con --limpiar, elimina los bolsillos que hayan quedado de corridas anteriores.
 *   4. Si el saldo está por debajo de `saldoMinimo`, deposita la diferencia.
 *
 * Uso (con el backend arriba en :3001):
 *   node katalon/scripts/seed-usuarios.mjs            # crea / repone saldo
 *   node katalon/scripts/seed-usuarios.mjs --limpiar  # además borra bolsillos
 *
 * Los datos salen de `katalon/usuarios-estaticos.json`. La contraseña no se
 * imprime en consola.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(here, '..', 'usuarios-estaticos.json'), 'utf8'));
const API = (process.env.KATALON_API_URL ?? config.api).replace(/\/$/, '');
const limpiar = process.argv.includes('--limpiar');

async function call(method, path, { token, body } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  return { status: response.status, payload };
}

function fail(message) {
  throw new Error(message);
}

async function iniciarSesion(usuario) {
  const login = await call('POST', '/auth/login', {
    body: { email: usuario.email, password: usuario.password },
  });
  if (login.status === 200) {
    if (login.payload.data?.requiresTwoFactor) {
      fail(`${usuario.email} tiene 2FA activo; desactívalo en Perfil para que Katalon pueda iniciar sesión.`);
    }
    return { token: login.payload.data.token, creado: false };
  }
  if (login.status === 429) {
    fail('El backend limitó los inicios de sesión (10 por minuto). Espera un minuto y vuelve a correr el script.');
  }

  const registro = await call('POST', '/auth/register', {
    body: {
      firstName: usuario.firstName,
      lastName: usuario.lastName,
      birthDate: '1998-04-15',
      email: usuario.email,
      document: usuario.document,
      monthlyIncome: 3_500_000,
      password: usuario.password,
      confirmPassword: usuario.password,
    },
  });
  if (registro.status !== 201) {
    fail(`No se pudo registrar ${usuario.email} (HTTP ${registro.status}): ${JSON.stringify(registro.payload.error ?? registro.payload)}. `
      + 'Si el correo ya existe con otra contraseña, cambia la contraseña en usuarios-estaticos.json o borra el usuario.');
  }
  return { token: registro.payload.data.token, creado: true };
}

async function cuentaDeAhorros(token) {
  const cuentas = await call('GET', '/accounts/me', { token });
  const lista = cuentas.payload.data ?? [];
  const ahorros = lista.find((c) => c.accountType === 'AHORROS' && c.status === 'ACTIVA');
  if (ahorros) {
    if (lista.length > 1) {
      console.warn('  ! El usuario tiene más de una cuenta; los casos usan la primera tarjeta de /accounts.');
    }
    return ahorros;
  }
  const nueva = await call('POST', '/accounts', { token, body: { type: 'AHORROS' } });
  if (nueva.status !== 201) {
    fail(`No se pudo abrir la cuenta de ahorros (HTTP ${nueva.status}): ${JSON.stringify(nueva.payload)}`);
  }
  return nueva.payload.data;
}

async function borrarBolsillos(token, cuenta) {
  const bolsillos = (await call('GET', `/pockets/account/${cuenta.id}`, { token })).payload.data ?? [];
  for (const bolsillo of bolsillos) {
    await call('DELETE', `/pockets/${bolsillo.id}`, { token });
  }
  return bolsillos.length;
}

async function prepararUsuario(rol, usuario) {
  console.log(`\n[${rol}] ${usuario.email}`);
  const { token, creado } = await iniciarSesion(usuario);
  console.log(creado ? '  registrado' : '  ya existía');

  let cuenta = await cuentaDeAhorros(token);
  console.log(`  cuenta de ahorros ${cuenta.accountNumber} (${cuenta.id})`);

  if (limpiar) {
    console.log(`  bolsillos eliminados: ${await borrarBolsillos(token, cuenta)}`);
    cuenta = (await call('GET', `/accounts/${cuenta.id}`, { token })).payload.data ?? cuenta;
  }

  const faltante = usuario.saldoMinimo - cuenta.balance;
  if (faltante > 0) {
    const deposito = await call('POST', `/accounts/${cuenta.id}/deposit`, {
      token,
      body: { amount: faltante, description: 'Saldo inicial pruebas Katalon' },
    });
    if (deposito.status !== 200) {
      fail(`No se pudo depositar el saldo inicial (HTTP ${deposito.status}): ${JSON.stringify(deposito.payload)}`);
    }
    cuenta = deposito.payload.data;
  }
  console.log(`  saldo disponible: $${cuenta.balance.toLocaleString('es-CO')}`);
}

try {
  await fetch(`${API.replace(/\/api\/v1$/, '')}/health`).catch(() =>
    fail(`El backend no responde en ${API}. Levántalo con: npm --prefix backend run dev`));
  for (const [rol, usuario] of Object.entries(config.usuarios)) {
    await prepararUsuario(rol, usuario);
  }
  console.log('\nUsuarios estáticos listos para Katalon Recorder.');
} catch (error) {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
}
