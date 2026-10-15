#!/usr/bin/env node
/**
 * Genera los casos de prueba de Katalon Recorder (formato Selenese HTML, igual
 * al ejemplo del profesor) para las 6 funcionalidades del módulo Bolsillos:
 *
 *   katalon/casos/<NN_funcionalidad>/TC1xx_<nombre>.html   un archivo por caso
 *   katalon/suites/Suite_<NN>_<funcionalidad>.html         una suite por funcionalidad
 *
 * Cada caso corresponde a un TC de "Casos y Escenarios FuBank.xlsx"
 * (TC-101 a TC-152) y repite sus pasos con comandos de Katalon Recorder.
 *
 * Uso: node katalon/scripts/generar-casos.mjs
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(raiz, 'usuarios-estaticos.json'), 'utf8'));
const WEB = config.web;
const API = config.api;
const PRINCIPAL = config.usuarios.principal;
const INTRUSO = config.usuarios.intruso;

// ─── Comandos y fragmentos reutilizables ─────────────────────────────────────

/** Una fila de Selenese: comando | target | value. */
const c = (comando, target = '', value = '') => [comando, String(target), String(value)];
const paso = (texto) => c('echo', texto);

/** Token de la sesión iniciada por el formulario (sin "Recordarme" queda en sessionStorage). */
const JS_TOKEN = "(window.sessionStorage.getItem('token')||window.localStorage.getItem('token'))";

/** Correo del usuario con sesión activa, o vacío si no hay sesión. */
const JS_USUARIO_ACTUAL =
  "(function(){try{return JSON.parse(window.sessionStorage.getItem('user')||window.localStorage.getItem('user')).email||''}catch(e){return ''}})()";

/** Equivale al "open /logout" del ejemplo: borra la sesión del navegador. */
const JS_CERRAR_SESION =
  "localStorage.clear();sessionStorage.clear();document.cookie='token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';";

/**
 * El formulario de login (react-hook-form) reinicia sus campos al montarse, y si
 * la hidratación falla React vuelve a crear la página: lo que se escriba antes se
 * pierde. Tras borrar la sesión, `fubank-theme` solo reaparece cuando el
 * ThemeProvider ya montó (su useEffect lo guarda), así que sirve de señal de
 * "página lista para escribir".
 */
const JS_PAGINA_HIDRATADA = "window.localStorage.getItem('fubank-theme') !== null";

/** Elimina por API los bolsillos que dejaron corridas anteriores (precondición: estado limpio). */
const JS_LIMPIAR_BOLSILLOS =
  `(function(){var t=${JS_TOKEN};var api='${API}';`
  + "function pedir(m,u){var x=new XMLHttpRequest();x.open(m,api+u,false);x.setRequestHeader('Authorization','Bearer '+t);x.send();return JSON.parse(x.responseText||'{}');}"
  + "var n=0;(pedir('GET','/accounts/me').data||[]).forEach(function(c){(pedir('GET','/pockets/account/'+c.id).data||[]).forEach(function(p){pedir('DELETE','/pockets/'+p.id);n++;});});return n;})()";

/**
 * Petición HTTP directa a la API desde la página (para los casos de seguridad).
 * Devuelve "<status> <código de error>", por ejemplo "403 FORBIDDEN".
 * `autorizacion`: 'sesion' (token del usuario logueado), 'ninguna' o un texto literal.
 */
function jsPeticion(metodo, ruta, { autorizacion = 'sesion', cuerpo } = {}) {
  let cabecera = '';
  if (autorizacion === 'sesion') cabecera = `x.setRequestHeader('Authorization','Bearer '+${JS_TOKEN});`;
  else if (autorizacion !== 'ninguna') cabecera = `x.setRequestHeader('Authorization','${autorizacion}');`;
  const envio = cuerpo
    ? `x.setRequestHeader('Content-Type','application/json');x.send('${JSON.stringify(cuerpo)}');`
    : 'x.send();';
  return `(function(){var x=new XMLHttpRequest();x.open('${metodo}','${API}${ruta}',false);${cabecera}${envio}`
    + "var c='';try{c=JSON.parse(x.responseText).error.code||''}catch(e){}return x.status+' '+c;})()";
}

/**
 * Katalon Recorder 7 escribe el texto pero React no se entera (no dispara
 * onChange): el formulario se envía vacío. Es un fallo conocido del Recorder
 * con React. Tras cada `type`, este script vuelve a poner el valor con el setter
 * nativo, desincroniza el `_valueTracker` con el que React compara y dispara
 * `input`, así React registra el cambio. Si `type` ya funcionó, no cambia nada.
 * El código se inserta como <script> para que corra en el contexto de la página
 * (donde vive React) aunque el Recorder ejecute runScript en un mundo aislado.
 */
function jsSincronizarConReact(id, valor) {
  const literal = `'${String(valor).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const codigo = `(function(){var el=document.getElementById('${id}');var v=${literal};`
    + "var t=el._valueTracker;if(t){t.setValue(v===''?' ':'');}"
    + "Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set.call(el,v);"
    + "el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));})();";
  return `var s=document.createElement('script');s.textContent=${JSON.stringify(codigo)};`
    + '(document.head||document.documentElement).appendChild(s);s.remove();';
}

/** Escribe en un campo por id: `type` + sincronización con React (ver arriba). */
const escribir = (id, valor) => [
  c('type', `id=${id}`, valor),
  c('runScript', jsSincronizarConReact(id, valor)),
];

/** Convierte un texto con formato de moneda ("$ 1.000.000") a número. */
const aNumero = (variable) => `Number('\${${variable}}'.replace(/[^0-9-]/g,''))`;

function iniciarSesion(usuario) {
  return [
    c('open', `${WEB}/`),
    c('storeEval', JS_USUARIO_ACTUAL, 'usuarioActual'),
    c('if', `'\${usuarioActual}' != '${usuario.email}'`),
    c('runScript', JS_CERRAR_SESION),
    c('open', `${WEB}/login`),
    c('waitForElementPresent', 'id=email'),
    c('waitForEval', JS_PAGINA_HIDRATADA, 'true'),
    ...escribir('email', usuario.email),
    ...escribir('password', usuario.password),
    c('click', 'css=form button[type="submit"]'),
    c('waitForElementPresent', 'css=button[title="Cerrar sesión"]'),
    c('assertLocation', 'glob:*/profile'),
    c('endIf'),
  ];
}

const limpiarBolsillos = () => [
  c('storeEval', JS_LIMPIAR_BOLSILLOS, 'bolsillosEliminados'),
  c('echo', 'Precondición: bolsillos de corridas anteriores eliminados = ${bolsillosEliminados}'),
];

/** Abre Cuentas y guarda el saldo disponible de la cuenta de ahorros en `variable`. */
const leerSaldo = (variable) => [
  c('open', `${WEB}/accounts`),
  c('waitForElementPresent', 'css=[data-testid="account-balance"]'),
  c('storeText', 'css=[data-testid="account-balance"]', 'saldoTexto'),
  c('storeEval', aNumero('saldoTexto'), variable),
  c('echo', `${variable} = \${${variable}}`),
];

/** Lee el saldo y comprueba la expresión, p. ej. "${saldoFinal} == ${saldoInicial} - 300". */
const verificarSaldo = (variable, expresion) => [
  ...leerSaldo(variable),
  c('assertEval', `\${${variable}} == ${expresion}`, 'true'),
];

const abrirBolsillos = () => [
  c('open', `${WEB}/pockets`),
  c('waitForElementPresent', "xpath=//select[@id='account-select']/option[@value!='']"),
  c('pause', '1000'),
  c('waitForElementPresent', 'css=[data-testid="create-pocket-button"]:not([disabled])'),
  c('assertText', 'css=h1', 'exact:Bolsillos de Ahorro'),
];

const crearBolsillo = (nombre, monto) => [
  ...escribir('pocket-name', nombre),
  ...escribir('pocket-amount', monto),
  c('click', 'css=[data-testid="create-pocket-button"]'),
];

const xToast = (titulo) => `xpath=//*[@data-testid='toast-title' and normalize-space(.)='${titulo}']`;

/**
 * Valida el toast (título y, si se indica, descripción). El toast se cierra solo
 * a los 4 s, así que la espera ya exige título + descripción y solo queda una
 * aserción después: Katalon es lento y no alcanza a hacer más pasos sobre él.
 */
function toast(titulo, descripcion) {
  const xEsperado = descripcion
    ? `${xToast(titulo)}/following-sibling::p[contains(.,'${descripcion}')]`
    : xToast(titulo);
  return [
    c('waitForElementPresent', xEsperado),
    c('assertText', xToast(titulo), `exact:${titulo}`),
  ];
}

const xTarjeta = (nombre) =>
  `xpath=//*[@data-testid='pocket-card'][.//*[@data-testid='pocket-card-name' and normalize-space(.)='${nombre}']]`;

/** Lee el monto mostrado en la tarjeta del bolsillo y lo compara con la expresión. */
const verificarMontoTarjeta = (nombre, expresion) => [
  c('waitForElementPresent', xTarjeta(nombre)),
  c('storeText', `${xTarjeta(nombre)}//*[@data-testid='pocket-card-amount']`, 'montoTexto'),
  c('storeEval', aNumero('montoTexto'), 'montoBolsillo'),
  c('assertEval', `\${montoBolsillo} == ${expresion}`, 'true'),
];

function editarBolsillo(nombre, { nuevoNombre, nuevoMonto } = {}) {
  const filas = [
    c('waitForElementPresent', xTarjeta(nombre)),
    c('click', `${xTarjeta(nombre)}//*[@data-testid='edit-pocket-button']`),
    c('waitForElementPresent', 'id=edit-pocket-amount'),
  ];
  if (nuevoNombre !== undefined) filas.push(...escribir('edit-pocket-name', nuevoNombre));
  if (nuevoMonto !== undefined) filas.push(...escribir('edit-pocket-amount', nuevoMonto));
  filas.push(c('click', 'css=[data-testid="save-pocket-button"]'));
  return filas;
}

const eliminarBolsillo = (nombre) => [
  c('waitForElementPresent', xTarjeta(nombre)),
  c('click', `${xTarjeta(nombre)}//*[@data-testid='delete-pocket-button']`),
  c('waitForElementPresent', 'css=[data-testid="confirm-delete-pocket-button"]'),
  c('assertText', "xpath=//h3[normalize-space(.)='Eliminar bolsillo']/ancestor::div[contains(@class,'max-w-md')][1]//p[contains(@class,'text-lg')]", `exact:${nombre}?`),
  c('click', 'css=[data-testid="confirm-delete-pocket-button"]'),
];

/** Abre Notificaciones y valida que exista la notificación con ese título y texto. */
function verificarNotificacion(titulo, mensaje) {
  const xMensaje = `xpath=//h3[normalize-space(.)='${titulo}']/ancestor::div[contains(@class,'flex-1')][1]/p[contains(.,'${mensaje}')]`;
  return [
    c('open', `${WEB}/notifications`),
    c('waitForElementPresent', 'xpath=//h1[normalize-space(.)=\'Notificaciones\']'),
    c('waitForElementPresent', xMensaje),
    c('assertText', xMensaje, `glob:*${mensaje}*`),
  ];
}

/** Ejecuta la petición, deja la respuesta en el log y la compara con "<status> <código>". */
const verificarRespuestaApi = (js, esperado) => [
  c('storeEval', js, 'respuesta'),
  c('echo', 'Respuesta de la API: ${respuesta}'),
  c('assertEval', "'${respuesta}'", `exact:${esperado}`),
];

/** Inicio común de los casos de Bolsillos con el usuario principal. */
const inicioBolsillos = () => [
  paso('Paso 1: Iniciar sesion y abrir Bolsillos'),
  ...iniciarSesion(PRINCIPAL),
  ...limpiarBolsillos(),
  ...leerSaldo('saldoInicial'),
  ...abrirBolsillos(),
];

/** Crea un bolsillo de apoyo para los casos que parten de "Cuenta con un bolsillo existente". */
const conBolsillo = (nombre, monto) => [
  ...crearBolsillo(nombre, monto),
  ...toast('Bolsillo creado'),
  ...verificarMontoTarjeta(nombre, monto),
];

/** Primera tarjeta de /notifications (la lista viene de la más reciente a la más antigua). */
const NOTIFICACION_RECIENTE = "(//h3/parent::div[contains(@class,'justify-between')]/parent::div[contains(@class,'flex-1')])[1]";

const nombreDeLongitud = (n) => `Bolsillo largo ${'x'.repeat(n - 'Bolsillo largo '.length)}`;
const UUID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

// ─── Depositar ───────────────────────────────────────────────────────────────

const inicioDeposito = () => [
  paso('Paso 1: Iniciar sesion y abrir Cuentas'),
  ...iniciarSesion(PRINCIPAL),
  ...leerSaldo('saldoInicial'),
  c('assertText', 'css=h1', 'exact:Cuenta Digital'),
];

const abrirDeposito = () => [
  c('click', 'css=[data-testid="deposit-button"]'),
  c('waitForElementPresent', 'id=dw-amount'),
  c('assertText', "xpath=//h3[contains(.,'Agregar Dinero')]", 'exact:Agregar Dinero (Depósito)'),
];

function depositar(monto, descripcion) {
  const filas = [...abrirDeposito(), ...escribir('dw-amount', monto)];
  if (descripcion !== undefined) filas.push(...escribir('dw-description', descripcion));
  filas.push(c('click', 'css=[data-testid="dw-submit"]'));
  return filas;
}

const depositoExitoso = () => [
  ...toast('Deposito realizado', 'actualizada correctamente.'),
  c('waitForElementNotPresent', 'id=dw-amount'),
];

const depositoRechazado = () => [
  c('waitForElementPresent', 'css=[data-testid="dw-error"]'),
  c('assertText', 'css=[data-testid="dw-error"]', 'exact:Por favor ingresa un monto válido mayor a cero.'),
  c('assertElementPresent', 'id=dw-amount'),
  c('assertElementNotPresent', xToast('Deposito realizado')),
];

// ─── Casos de prueba (TC-101 a TC-152) ───────────────────────────────────────

const tc = (id, nombre, filas) => ({ id, nombre: `TC${id}_${nombre}`, filas });

const funcionalidades = [
  {
    carpeta: '01_Crear_bolsillo',
    titulo: 'HU-23 Crear bolsillo',
    casos: [
      tc(101, 'Crear_monto_valido_menor_al_saldo', [
        ...inicioBolsillos(),
        paso("Paso 2: Crear el bolsillo 'Vacaciones' con monto 300"),
        ...crearBolsillo('Vacaciones', 300),
        paso('Paso 3: Verificar creacion y saldo'),
        ...toast('Bolsillo creado', 'Tu ahorro quedó organizado correctamente.'),
        ...verificarMontoTarjeta('Vacaciones', 300),
        ...verificarSaldo('saldoFinal', '${saldoInicial} - 300'),
      ]),
      tc(102, 'Crear_monto_cero_limite', [
        ...inicioBolsillos(),
        paso("Paso 2: Crear el bolsillo 'Meta sin fondo' con monto 0"),
        ...crearBolsillo('Meta sin fondo', 0),
        paso('Paso 3: Verificar creacion y saldo sin cambios'),
        ...toast('Bolsillo creado'),
        ...verificarMontoTarjeta('Meta sin fondo', 0),
        ...verificarSaldo('saldoFinal', '${saldoInicial}'),
      ]),
      tc(103, 'Crear_monto_igual_al_saldo_limite', [
        ...inicioBolsillos(),
        paso("Paso 2: Crear 'Reserva total' con todo el saldo disponible"),
        ...crearBolsillo('Reserva total', '${saldoInicial}'),
        paso('Paso 3: Verificar creacion y saldo en 0'),
        ...toast('Bolsillo creado'),
        ...verificarMontoTarjeta('Reserva total', '${saldoInicial}'),
        ...verificarSaldo('saldoFinal', '0'),
      ]),
      tc(104, 'Crear_nombre_150_caracteres', [
        ...inicioBolsillos(),
        paso('Paso 2: Crear con nombre de 150 caracteres y monto 0'),
        ...crearBolsillo(nombreDeLongitud(150), 0),
        paso('Paso 3: Verificar creacion con el nombre completo'),
        ...toast('Bolsillo creado'),
        c('waitForElementPresent', xTarjeta(nombreDeLongitud(150))),
        c('assertText', `${xTarjeta(nombreDeLongitud(150))}//*[@data-testid='pocket-card-name']`, `exact:${nombreDeLongitud(150)}`),
      ]),
      tc(105, 'Crear_genera_notificacion', [
        ...inicioBolsillos(),
        c('storeEval', "'Navidad ' + Date.now()", 'nombreBolsillo'),
        paso('Paso 2: Crear el bolsillo ${nombreBolsillo} con monto 100'),
        ...crearBolsillo('${nombreBolsillo}', 100),
        ...toast('Bolsillo creado'),
        c('waitForElementPresent', xTarjeta('${nombreBolsillo}')),
        paso('Paso 3: Verificar la notificacion en /notifications'),
        ...verificarNotificacion('Bolsillo creado', 'Creaste el bolsillo "${nombreBolsillo}" con $100'),
      ]),
      tc(106, 'Crear_monto_negativo', [
        ...inicioBolsillos(),
        paso("Paso 2: Intentar crear 'Negativo' con monto -1"),
        ...crearBolsillo('Negativo', -1),
        paso('Paso 3: Verificar rechazo y saldo sin cambios'),
        ...toast('No fue posible crear el bolsillo', 'Error de validación'),
        c('assertElementNotPresent', xTarjeta('Negativo')),
        ...verificarSaldo('saldoFinal', '${saldoInicial}'),
      ]),
      tc(107, 'Crear_monto_mayor_al_saldo', [
        ...inicioBolsillos(),
        c('storeEval', '${saldoInicial} + 1', 'montoExcedido'),
        paso("Paso 2: Intentar crear 'Excede' con monto saldo + 1 (${montoExcedido})"),
        ...crearBolsillo('Excede', '${montoExcedido}'),
        paso('Paso 3: Verificar rechazo y saldo sin cambios'),
        ...toast('No fue posible crear el bolsillo', 'No tienes saldo disponible suficiente para crear este bolsillo'),
        c('assertElementNotPresent', xTarjeta('Excede')),
        ...verificarSaldo('saldoFinal', '${saldoInicial}'),
      ]),
      tc(108, 'Crear_monto_que_supera_lo_reservado', [
        ...inicioBolsillos(),
        paso("Precondicion: bolsillo 'Primero' que reserva 300"),
        ...conBolsillo('Primero', 300),
        ...leerSaldo('saldoRestante'),
        ...abrirBolsillos(),
        c('storeEval', '${saldoRestante} + 1', 'montoExcedido'),
        paso("Paso 2: Intentar crear 'Segundo' con el saldo restante + 1 (${montoExcedido})"),
        ...crearBolsillo('Segundo', '${montoExcedido}'),
        paso('Paso 3: Verificar rechazo'),
        ...toast('No fue posible crear el bolsillo', 'No tienes saldo disponible suficiente para crear este bolsillo'),
        c('assertElementNotPresent', xTarjeta('Segundo')),
        c('assertElementPresent', xTarjeta('Primero')),
      ]),
      tc(109, 'Crear_nombre_vacio', [
        ...inicioBolsillos(),
        paso('Paso 2: Intentar crear sin nombre y monto 100'),
        ...crearBolsillo('', 100),
        paso('Paso 3: Verificar rechazo'),
        ...toast('Falta información', 'Selecciona una cuenta y escribe el nombre del bolsillo.'),
        c('assertElementNotPresent', 'css=[data-testid="pocket-card"]'),
      ]),
      tc(110, 'Crear_nombre_solo_espacios', [
        ...inicioBolsillos(),
        c('storeEval', "'   '", 'nombreEspacios'),
        paso('Paso 2: Intentar crear con un nombre de solo espacios y monto 100'),
        ...crearBolsillo('${nombreEspacios}', 100),
        paso('Paso 3: Verificar el rechazo y que el bolsillo NO se cree (DEF-001)'),
        ...toast('Falta información', 'Selecciona una cuenta y escribe el nombre del bolsillo.'),
        c('assertElementNotPresent', xToast('Bolsillo creado')),
        c('assertElementNotPresent', 'css=[data-testid="pocket-card"]'),
      ]),
      tc(111, 'Crear_nombre_mayor_a_150', [
        ...inicioBolsillos(),
        paso('Paso 2: Intentar crear con nombre de 151 caracteres y monto 0'),
        ...crearBolsillo(nombreDeLongitud(151), 0),
        paso('Paso 3: Verificar rechazo'),
        ...toast('No fue posible crear el bolsillo', 'Error de validación'),
        c('assertElementNotPresent', 'css=[data-testid="pocket-card"]'),
      ]),
    ],
  },
  {
    carpeta: '02_Consultar_bolsillos',
    titulo: 'HU-24 Consultar bolsillos',
    casos: [
      tc(112, 'Consultar_cuenta_con_un_bolsillo', [
        ...inicioBolsillos(),
        paso("Precondicion: la cuenta tiene exactamente un bolsillo ('Unico' $100)"),
        ...conBolsillo('Unico', 100),
        paso('Paso 2: Consultar los bolsillos de la cuenta (recargar la pantalla)'),
        ...abrirBolsillos(),
        c('waitForElementPresent', xTarjeta('Unico')),
        paso('Paso 3: Verificar el unico bolsillo'),
        c('assertXpathCount', "//*[@data-testid='pocket-card']", '1'),
        ...verificarMontoTarjeta('Unico', 100),
      ]),
      tc(113, 'Consultar_cuenta_con_varios_bolsillos', [
        ...inicioBolsillos(),
        paso('Precondicion: la cuenta tiene 3 bolsillos'),
        ...conBolsillo('Viaje', 100),
        ...conBolsillo('Estudio', 200),
        ...conBolsillo('Salud', 300),
        paso('Paso 2: Consultar los bolsillos de la cuenta (recargar la pantalla)'),
        ...abrirBolsillos(),
        c('waitForElementPresent', xTarjeta('Viaje')),
        c('waitForElementPresent', xTarjeta('Estudio')),
        c('waitForElementPresent', xTarjeta('Salud')),
        paso('Paso 3: Verificar la cantidad'),
        c('assertXpathCount', "//*[@data-testid='pocket-card']", '3'),
      ]),
      tc(114, 'Consultar_datos_correctos_por_bolsillo', [
        ...inicioBolsillos(),
        paso("Precondicion: bolsillos 'Hogar' $150 y 'Carro' $250"),
        ...conBolsillo('Hogar', 150),
        ...conBolsillo('Carro', 250),
        paso('Paso 2: Consultar los bolsillos (recargar la pantalla)'),
        ...abrirBolsillos(),
        paso('Paso 3: Verificar nombre y monto de cada bolsillo'),
        ...verificarMontoTarjeta('Hogar', 150),
        ...verificarMontoTarjeta('Carro', 250),
      ]),
      tc(115, 'Consultar_cuenta_sin_bolsillos', [
        paso('Paso 1: Iniciar sesion con el usuario sin bolsillos y abrir Bolsillos'),
        ...iniciarSesion(INTRUSO),
        ...limpiarBolsillos(),
        ...abrirBolsillos(),
        paso('Paso 2: Verificar el estado vacio'),
        c('waitForElementPresent', 'css=[data-testid="pockets-empty"]'),
        c('assertText', 'css=[data-testid="pockets-empty"]', 'glob:*No hay bolsillos para esta cuenta aún.*'),
        c('assertElementNotPresent', 'css=[data-testid="pocket-card"]'),
      ]),
      tc(116, 'Consultar_cuenta_ajena_API', [
        ...inicioBolsillos(),
        paso("Paso 1: Preparar la cuenta del propietario con el bolsillo 'Privado' $200"),
        ...conBolsillo('Privado', 200),
        c('storeValue', 'id=account-select', 'cuentaPropietario'),
        paso('Paso 2: Consultar esos bolsillos con otro usuario (intruso)'),
        ...iniciarSesion(INTRUSO),
        ...verificarRespuestaApi(jsPeticion('GET', '/pockets/account/${cuentaPropietario}'), '403 FORBIDDEN'),
      ]),
      tc(117, 'Consultar_cuenta_inexistente_API', [
        paso('Paso 1: Iniciar sesion y usar un accountId que no existe'),
        ...iniciarSesion(PRINCIPAL),
        paso('Paso 2: Consultar los bolsillos de esa cuenta'),
        ...verificarRespuestaApi(jsPeticion('GET', `/pockets/account/${UUID_INEXISTENTE}`), '404 ACCOUNT_NOT_FOUND'),
      ]),
      tc(118, 'Consultar_sin_autenticacion_API', [
        paso('Paso 1: Obtener un accountId real'),
        ...iniciarSesion(PRINCIPAL),
        ...abrirBolsillos(),
        c('storeValue', 'id=account-select', 'cuentaId'),
        paso('Paso 2: Consultar GET /pockets/account/:accountId sin cabecera Authorization'),
        ...verificarRespuestaApi(jsPeticion('GET', '/pockets/account/${cuentaId}', { autorizacion: 'ninguna' }), '401 UNAUTHORIZED'),
      ]),
    ],
  },
  {
    carpeta: '03_Editar_bolsillo',
    titulo: 'HU-24 Editar bolsillo',
    casos: [
      tc(119, 'Editar_solo_el_nombre', [
        ...inicioBolsillos(),
        ...conBolsillo('Vacaciones', 300),
        ...leerSaldo('saldoAntes'),
        ...abrirBolsillos(),
        paso("Paso 2: Cambiar solo el nombre a 'Vacaciones 2026'"),
        ...editarBolsillo('Vacaciones', { nuevoNombre: 'Vacaciones 2026' }),
        paso('Paso 3: Verificar el nuevo nombre con el mismo monto y saldo'),
        ...toast('Bolsillo actualizado', 'Los cambios quedaron guardados.'),
        ...verificarMontoTarjeta('Vacaciones 2026', 300),
        c('assertElementNotPresent', xTarjeta('Vacaciones')),
        ...verificarSaldo('saldoDespues', '${saldoAntes}'),
      ]),
      tc(120, 'Editar_aumentar_monto_con_saldo', [
        ...inicioBolsillos(),
        ...conBolsillo('Vacaciones', 300),
        ...leerSaldo('saldoAntes'),
        ...abrirBolsillos(),
        paso('Paso 2: Aumentar el monto a 500 (+200)'),
        ...editarBolsillo('Vacaciones', { nuevoMonto: 500 }),
        paso('Paso 3: Verificar monto y saldo'),
        ...toast('Bolsillo actualizado'),
        ...verificarMontoTarjeta('Vacaciones', 500),
        ...verificarSaldo('saldoDespues', '${saldoAntes} - 200'),
      ]),
      tc(121, 'Editar_reducir_monto', [
        ...inicioBolsillos(),
        ...conBolsillo('Vacaciones', 300),
        ...leerSaldo('saldoAntes'),
        ...abrirBolsillos(),
        paso('Paso 2: Reducir el monto a 200 (-100)'),
        ...editarBolsillo('Vacaciones', { nuevoMonto: 200 }),
        paso('Paso 3: Verificar devolucion al saldo'),
        ...toast('Bolsillo actualizado'),
        ...verificarMontoTarjeta('Vacaciones', 200),
        ...verificarSaldo('saldoDespues', '${saldoAntes} + 100'),
      ]),
      tc(122, 'Editar_nombre_y_monto', [
        ...inicioBolsillos(),
        ...conBolsillo('Vacaciones', 300),
        ...leerSaldo('saldoAntes'),
        ...abrirBolsillos(),
        paso("Paso 2: Cambiar el nombre a 'Meta viaje' y el monto a 400"),
        ...editarBolsillo('Vacaciones', { nuevoNombre: 'Meta viaje', nuevoMonto: 400 }),
        paso('Paso 3: Verificar nombre, monto y saldo'),
        ...toast('Bolsillo actualizado'),
        ...verificarMontoTarjeta('Meta viaje', 400),
        ...verificarSaldo('saldoDespues', '${saldoAntes} - 100'),
      ]),
      tc(123, 'Editar_genera_notificacion', [
        ...inicioBolsillos(),
        c('storeEval', "'Meta ' + Date.now()", 'nombreBolsillo'),
        ...conBolsillo('${nombreBolsillo}', 300),
        paso('Paso 2: Actualizar el monto del bolsillo ${nombreBolsillo} a 350'),
        ...editarBolsillo('${nombreBolsillo}', { nuevoMonto: 350 }),
        ...toast('Bolsillo actualizado'),
        paso('Paso 3: Verificar la notificacion en /notifications'),
        ...verificarNotificacion('Bolsillo actualizado', 'Actualizaste el bolsillo "${nombreBolsillo}"'),
      ]),
      tc(124, 'Editar_aumento_sin_saldo_suficiente', [
        ...inicioBolsillos(),
        ...conBolsillo('Vacaciones', 300),
        ...leerSaldo('saldoAntes'),
        ...abrirBolsillos(),
        c('storeEval', '300 + ${saldoAntes} + 1', 'montoExcedido'),
        paso('Paso 2: Aumentar el monto por encima del saldo disponible (${montoExcedido})'),
        ...editarBolsillo('Vacaciones', { nuevoMonto: '${montoExcedido}' }),
        paso('Paso 3: Verificar rechazo y monto original'),
        ...toast('No fue posible actualizar el bolsillo', 'No tienes saldo disponible suficiente para ajustar este bolsillo'),
        ...abrirBolsillos(),
        ...verificarMontoTarjeta('Vacaciones', 300),
        ...verificarSaldo('saldoDespues', '${saldoAntes}'),
      ]),
      tc(125, 'Editar_monto_negativo', [
        ...inicioBolsillos(),
        ...conBolsillo('Vacaciones', 300),
        paso('Paso 2: Editar con monto -1'),
        ...editarBolsillo('Vacaciones', { nuevoMonto: -1 }),
        paso('Paso 3: Verificar rechazo y monto original'),
        ...toast('No fue posible actualizar el bolsillo', 'Error de validación'),
        ...abrirBolsillos(),
        ...verificarMontoTarjeta('Vacaciones', 300),
      ]),
      tc(126, 'Editar_nombre_vacio', [
        ...inicioBolsillos(),
        ...conBolsillo('Vacaciones', 300),
        paso('Paso 2: Editar dejando el nombre vacio'),
        ...editarBolsillo('Vacaciones', { nuevoNombre: '' }),
        paso('Paso 3: Verificar rechazo y nombre original'),
        ...toast('Nombre inválido', 'El nombre del bolsillo no puede quedar vacío.'),
        ...abrirBolsillos(),
        ...verificarMontoTarjeta('Vacaciones', 300),
      ]),
      tc(127, 'Editar_bolsillo_inexistente_API', [
        paso('Paso 1: Iniciar sesion y usar un pocketId que no existe'),
        ...iniciarSesion(PRINCIPAL),
        paso('Paso 2: Intentar actualizar ese bolsillo (PATCH con amount 100)'),
        ...verificarRespuestaApi(jsPeticion('PATCH', `/pockets/${UUID_INEXISTENTE}`, { cuerpo: { amount: 100 } }), '404 POCKET_NOT_FOUND'),
      ]),
    ],
  },
  {
    carpeta: '04_Eliminar_bolsillo',
    titulo: 'HU-25 Eliminar bolsillo',
    casos: [
      tc(128, 'Eliminar_bolsillo_existente', [
        ...inicioBolsillos(),
        ...conBolsillo('Temporal', 300),
        paso("Paso 2: Eliminar el bolsillo 'Temporal' y confirmar"),
        ...eliminarBolsillo('Temporal'),
        paso('Paso 3: Verificar eliminacion'),
        ...toast('Bolsillo eliminado', 'El saldo volvió a la cuenta correctamente.'),
        c('assertElementNotPresent', xTarjeta('Temporal')),
      ]),
      tc(129, 'Eliminar_devuelve_el_saldo', [
        ...inicioBolsillos(),
        ...conBolsillo('Temporal', 300),
        ...verificarSaldo('saldoConBolsillo', '${saldoInicial} - 300'),
        ...abrirBolsillos(),
        paso("Paso 2: Eliminar el bolsillo 'Temporal' ($300)"),
        ...eliminarBolsillo('Temporal'),
        ...toast('Bolsillo eliminado'),
        paso('Paso 3: Verificar que los $300 vuelven al saldo'),
        ...verificarSaldo('saldoFinal', '${saldoInicial}'),
      ]),
      tc(130, 'Eliminar_genera_notificacion', [
        ...inicioBolsillos(),
        c('storeEval', "'Borrar ' + Date.now()", 'nombreBolsillo'),
        ...conBolsillo('${nombreBolsillo}', 100),
        paso('Paso 2: Eliminar el bolsillo ${nombreBolsillo}'),
        ...eliminarBolsillo('${nombreBolsillo}'),
        ...toast('Bolsillo eliminado'),
        paso('Paso 3: Verificar la notificacion en /notifications'),
        ...verificarNotificacion('Bolsillo eliminado', 'Eliminaste el bolsillo "${nombreBolsillo}"'),
      ]),
      tc(131, 'Eliminar_bolsillo_inexistente_API', [
        paso('Paso 1: Iniciar sesion y usar un pocketId que no existe'),
        ...iniciarSesion(PRINCIPAL),
        paso('Paso 2: Intentar eliminar ese bolsillo'),
        ...verificarRespuestaApi(jsPeticion('DELETE', `/pockets/${UUID_INEXISTENTE}`), '404 POCKET_NOT_FOUND'),
      ]),
      tc(132, 'Eliminar_bolsillo_de_cuenta_ajena_API', [
        ...inicioBolsillos(),
        paso("Paso 1: Preparar el bolsillo 'Privado' $200 del propietario"),
        ...conBolsillo('Privado', 200),
        c('storeText', `${xTarjeta('Privado')}/p[contains(@class,'text-xs')]`, 'idBolsillo'),
        ...leerSaldo('saldoAntes'),
        paso('Paso 2: Intentar eliminarlo con otro usuario (intruso)'),
        ...iniciarSesion(INTRUSO),
        ...verificarRespuestaApi(jsPeticion('DELETE', '/pockets/${idBolsillo}'), '403 FORBIDDEN'),
        paso('Paso 3: Verificar que el bolsillo sigue y el saldo no cambia'),
        ...iniciarSesion(PRINCIPAL),
        ...abrirBolsillos(),
        ...verificarMontoTarjeta('Privado', 200),
        ...verificarSaldo('saldoDespues', '${saldoAntes}'),
      ]),
      tc(133, 'Eliminar_con_token_invalido_API', [
        ...inicioBolsillos(),
        paso("Paso 1: Preparar el bolsillo 'Protegido' $100"),
        ...conBolsillo('Protegido', 100),
        c('storeText', `${xTarjeta('Protegido')}/p[contains(@class,'text-xs')]`, 'idBolsillo'),
        paso('Paso 2: DELETE /pockets/:pocketId con Authorization: Bearer token-falsificado'),
        ...verificarRespuestaApi(jsPeticion('DELETE', '/pockets/${idBolsillo}', { autorizacion: 'Bearer token-falsificado' }), '401 TOKEN_INVALID'),
        paso('Paso 3: Verificar que el bolsillo no se elimino'),
        ...abrirBolsillos(),
        ...verificarMontoTarjeta('Protegido', 100),
      ]),
    ],
  },
  {
    carpeta: '05_Transferir',
    titulo: 'HU-26 Transferir (agregar y retirar dinero del bolsillo)',
    casos: [
      tc(134, 'Transferir_monto_parcial', [
        ...inicioBolsillos(),
        ...conBolsillo('Ahorro', 100),
        ...leerSaldo('saldoAntes'),
        ...abrirBolsillos(),
        paso('Paso 2: Agregar $5.000 al bolsillo (monto 100 -> 5100)'),
        ...editarBolsillo('Ahorro', { nuevoMonto: 5100 }),
        ...toast('Bolsillo actualizado'),
        paso('Paso 3: Verificar ambos saldos'),
        ...verificarMontoTarjeta('Ahorro', 5100),
        ...verificarSaldo('saldoDespues', '${saldoAntes} - 5000'),
      ]),
      tc(135, 'Transferir_todo_el_saldo_limite', [
        ...inicioBolsillos(),
        ...conBolsillo('Ahorro', 100),
        ...leerSaldo('saldoAntes'),
        ...abrirBolsillos(),
        c('storeEval', '100 + ${saldoAntes}', 'montoTotal'),
        paso('Paso 2: Agregar todo el saldo disponible al bolsillo (monto ${montoTotal})'),
        ...editarBolsillo('Ahorro', { nuevoMonto: '${montoTotal}' }),
        ...toast('Bolsillo actualizado'),
        paso('Paso 3: Verificar cuenta en 0'),
        ...verificarMontoTarjeta('Ahorro', '${montoTotal}'),
        ...verificarSaldo('saldoDespues', '0'),
      ]),
      tc(136, 'Transferir_monto_mayor_al_saldo', [
        ...inicioBolsillos(),
        ...conBolsillo('Ahorro', 100),
        ...leerSaldo('saldoAntes'),
        ...abrirBolsillos(),
        c('storeEval', '100 + ${saldoAntes} + 1', 'montoExcedido'),
        paso('Paso 2: Agregar mas que el saldo disponible (monto ${montoExcedido})'),
        ...editarBolsillo('Ahorro', { nuevoMonto: '${montoExcedido}' }),
        paso('Paso 3: Verificar rechazo sin cambios en los saldos'),
        ...toast('No fue posible actualizar el bolsillo', 'No tienes saldo disponible suficiente para ajustar este bolsillo'),
        ...abrirBolsillos(),
        ...verificarMontoTarjeta('Ahorro', 100),
        ...verificarSaldo('saldoDespues', '${saldoAntes}'),
      ]),
      tc(137, 'Transferir_monto_negativo', [
        ...inicioBolsillos(),
        ...conBolsillo('Ahorro', 100),
        ...leerSaldo('saldoAntes'),
        ...abrirBolsillos(),
        paso('Paso 2: Agregar un monto negativo (monto -1)'),
        ...editarBolsillo('Ahorro', { nuevoMonto: -1 }),
        paso('Paso 3: Verificar rechazo sin cambios en los saldos'),
        ...toast('No fue posible actualizar el bolsillo', 'Error de validación'),
        ...abrirBolsillos(),
        ...verificarMontoTarjeta('Ahorro', 100),
        ...verificarSaldo('saldoDespues', '${saldoAntes}'),
      ]),
      tc(138, 'Retirar_monto_parcial', [
        ...inicioBolsillos(),
        ...conBolsillo('Retiro', 500),
        ...leerSaldo('saldoAntes'),
        ...abrirBolsillos(),
        paso('Paso 2: Retirar $200 del bolsillo (monto 500 -> 300)'),
        ...editarBolsillo('Retiro', { nuevoMonto: 300 }),
        ...toast('Bolsillo actualizado'),
        paso('Paso 3: Verificar reflejo en la cuenta'),
        ...verificarMontoTarjeta('Retiro', 300),
        ...verificarSaldo('saldoDespues', '${saldoAntes} + 200'),
      ]),
      tc(139, 'Retirar_todo_el_saldo', [
        ...inicioBolsillos(),
        ...conBolsillo('Retiro', 500),
        ...leerSaldo('saldoAntes'),
        ...abrirBolsillos(),
        paso('Paso 2: Retirar todo el saldo del bolsillo (monto 0)'),
        ...editarBolsillo('Retiro', { nuevoMonto: 0 }),
        ...toast('Bolsillo actualizado'),
        paso('Paso 3: Verificar bolsillo en 0 y cuenta + 500'),
        ...verificarMontoTarjeta('Retiro', 0),
        ...verificarSaldo('saldoDespues', '${saldoAntes} + 500'),
      ]),
      tc(140, 'Retirar_monto_mayor_al_saldo', [
        ...inicioBolsillos(),
        ...conBolsillo('Retiro', 500),
        paso('Paso 2: Retirar mas de lo que tiene el bolsillo (monto -100)'),
        ...editarBolsillo('Retiro', { nuevoMonto: -100 }),
        paso('Paso 3: Verificar rechazo y monto original'),
        ...toast('No fue posible actualizar el bolsillo', 'Error de validación'),
        ...abrirBolsillos(),
        ...verificarMontoTarjeta('Retiro', 500),
      ]),
      tc(141, 'Retirar_monto_negativo', [
        ...inicioBolsillos(),
        ...conBolsillo('Retiro', 500),
        paso('Paso 2: Retirar un monto negativo (monto -1)'),
        ...editarBolsillo('Retiro', { nuevoMonto: -1 }),
        paso('Paso 3: Verificar rechazo y monto original'),
        ...toast('No fue posible actualizar el bolsillo', 'Error de validación'),
        ...abrirBolsillos(),
        ...verificarMontoTarjeta('Retiro', 500),
      ]),
    ],
  },
  {
    carpeta: '06_Depositar',
    titulo: 'Funcionalidad extra Depositar',
    casos: [
      tc(142, 'Depositar_monto_valido_con_descripcion', [
        ...inicioDeposito(),
        paso("Paso 2: Depositar 150000 con descripcion 'Ahorro mensual'"),
        ...depositar(150000, 'Ahorro mensual'),
        paso('Paso 3: Verificar deposito y saldo'),
        ...depositoExitoso(),
        ...verificarSaldo('saldoFinal', '${saldoInicial} + 150000'),
      ]),
      tc(143, 'Depositar_monto_valido_sin_descripcion', [
        ...inicioDeposito(),
        paso('Paso 2: Depositar 50000 sin descripcion'),
        ...depositar(50000),
        paso('Paso 3: Verificar deposito y saldo'),
        ...depositoExitoso(),
        ...verificarSaldo('saldoFinal', '${saldoInicial} + 50000'),
      ]),
      tc(144, 'Depositar_monto_minimo_limite', [
        ...inicioDeposito(),
        paso('Paso 2: Depositar el monto minimo (1)'),
        ...depositar(1),
        paso('Paso 3: Verificar deposito y saldo'),
        ...depositoExitoso(),
        ...verificarSaldo('saldoFinal', '${saldoInicial} + 1'),
      ]),
      tc(145, 'Depositar_depositos_sucesivos_se_acumulan', [
        ...inicioDeposito(),
        paso('Paso 2: Primer deposito de 100000'),
        ...depositar(100000),
        ...depositoExitoso(),
        ...verificarSaldo('saldoIntermedio', '${saldoInicial} + 100000'),
        paso('Paso 3: Segundo deposito de 50000'),
        ...depositar(50000),
        ...depositoExitoso(),
        paso('Paso 4: Verificar saldo acumulado'),
        ...verificarSaldo('saldoFinal', '${saldoInicial} + 150000'),
      ]),
      tc(146, 'Depositar_genera_notificacion', [
        ...inicioDeposito(),
        paso('Paso 2: Depositar 20000'),
        ...depositar(20000),
        ...depositoExitoso(),
        paso('Paso 3: Verificar la notificacion en /notifications (la mas reciente)'),
        c('open', `${WEB}/notifications`),
        c('waitForElementPresent', "xpath=//h3[normalize-space(.)='Depósito realizado']"),
        c('assertText', `xpath=${NOTIFICACION_RECIENTE}/div/h3`, 'exact:Depósito realizado'),
        c('assertText', `xpath=${NOTIFICACION_RECIENTE}/p`, 'glob:Depósito de $20.000 en tu cuenta ****'),
      ]),
      tc(147, 'Depositar_saldo_disponible_en_bolsillos', [
        ...inicioDeposito(),
        ...limpiarBolsillos(),
        ...leerSaldo('saldoInicial'),
        paso('Paso 2: Depositar 80000'),
        ...depositar(80000),
        ...depositoExitoso(),
        ...verificarSaldo('saldoConDeposito', '${saldoInicial} + 80000'),
        paso('Paso 3: Abrir Bolsillos'),
        ...abrirBolsillos(),
        paso("Paso 4: Crear 'Desde deposito' con el monto depositado (80000)"),
        ...crearBolsillo('Desde deposito', 80000),
        ...toast('Bolsillo creado'),
        ...verificarMontoTarjeta('Desde deposito', 80000),
        ...verificarSaldo('saldoFinal', '${saldoInicial}'),
      ]),
      tc(148, 'Depositar_monto_cero_limite', [
        ...inicioDeposito(),
        paso('Paso 2: Intentar depositar 0'),
        ...depositar(0),
        paso('Paso 3: Verificar rechazo y saldo sin cambios'),
        ...depositoRechazado(),
        ...verificarSaldo('saldoFinal', '${saldoInicial}'),
      ]),
      tc(149, 'Depositar_monto_negativo', [
        ...inicioDeposito(),
        paso('Paso 2: Intentar depositar -50000'),
        ...depositar(-50000),
        paso('Paso 3: Verificar rechazo y saldo sin cambios'),
        ...depositoRechazado(),
        ...verificarSaldo('saldoFinal', '${saldoInicial}'),
      ]),
      tc(150, 'Depositar_monto_vacio', [
        ...inicioDeposito(),
        paso('Paso 2: Intentar depositar sin escribir el monto'),
        ...depositar(''),
        paso('Paso 3: Verificar que el formulario no se envia (campo obligatorio)'),
        c('pause', '1500'),
        c('assertElementPresent', 'id=dw-amount'),
        c('assertEval', "window.document.getElementById('dw-amount').validity.valueMissing", 'true'),
        c('assertElementNotPresent', 'css=[data-testid="dw-error"]'),
        c('assertElementNotPresent', xToast('Deposito realizado')),
        ...verificarSaldo('saldoFinal', '${saldoInicial}'),
      ]),
      tc(151, 'Depositar_cancelar_con_boton_Cancelar', [
        ...inicioDeposito(),
        paso("Paso 2: Escribir 30000 y presionar 'Cancelar'"),
        ...abrirDeposito(),
        ...escribir('dw-amount', 30000),
        c('click', "xpath=//form[.//input[@id='dw-amount']]//button[normalize-space(.)='Cancelar']"),
        paso('Paso 3: Verificar que la ventana se cierra y el saldo no cambia'),
        c('waitForElementNotPresent', 'id=dw-amount'),
        c('assertElementNotPresent', xToast('Deposito realizado')),
        ...verificarSaldo('saldoFinal', '${saldoInicial}'),
      ]),
      tc(152, 'Depositar_cerrar_ventana_con_X', [
        ...inicioDeposito(),
        paso('Paso 2: Escribir 30000 y cerrar la ventana con la X'),
        ...abrirDeposito(),
        ...escribir('dw-amount', 30000),
        c('click', "xpath=//div[contains(@class,'justify-between')][.//h3[contains(.,'Agregar Dinero')]]/button"),
        paso('Paso 3: Verificar que la ventana se cierra y el saldo no cambia'),
        c('waitForElementNotPresent', 'id=dw-amount'),
        c('assertElementNotPresent', xToast('Deposito realizado')),
        ...verificarSaldo('saldoFinal', '${saldoInicial}'),
      ]),
    ],
  },
];

// ─── Escritura en el formato HTML de Katalon Recorder ────────────────────────

const escapar = (texto) =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

/**
 * Katalon Recorder lee el target con `td.childNodes[0].data`: una celda vacía
 * (`<td></td>`) rompe la importación con "Incorrect format". Para un target
 * vacío (p. ej. `endIf`) se escribe lo mismo que exporta Katalon: `<datalist></datalist>`.
 */
const celdaTarget = (target) => (target === '' ? '<datalist></datalist>' : escapar(target));

const tabla = (caso) =>
  `<table cellpadding="1" cellspacing="1" border="1"><thead><tr><td rowspan="1" colspan="3">${escapar(caso.nombre)}</td></tr></thead><tbody>`
  + caso.filas.map(([cmd, target, value]) => `<tr><td>${escapar(cmd)}</td><td>${celdaTarget(target)}</td><td>${escapar(value)}</td></tr>`).join('\n')
  + '</tbody></table>';

const documento = (titulo, casos) =>
  `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapar(titulo)}</title></head><body>`
  + casos.map(tabla).join('\n')
  + '</body></html>';

rmSync(join(raiz, 'casos'), { recursive: true, force: true });
rmSync(join(raiz, 'suites'), { recursive: true, force: true });
mkdirSync(join(raiz, 'suites'), { recursive: true });

let total = 0;
for (const [indice, funcionalidad] of funcionalidades.entries()) {
  const carpeta = join(raiz, 'casos', funcionalidad.carpeta);
  mkdirSync(carpeta, { recursive: true });
  for (const caso of funcionalidad.casos) {
    writeFileSync(join(carpeta, `${caso.nombre}.html`), documento(caso.nombre, [caso]));
    total++;
  }
  const nombreSuite = `Suite_${funcionalidad.carpeta}`;
  writeFileSync(join(raiz, 'suites', `${nombreSuite}.html`), documento(`Suite ${indice + 1} - ${funcionalidad.titulo}`, funcionalidad.casos));
  console.log(`${nombreSuite}: ${funcionalidad.casos.length} casos`);
}
console.log(`Total: ${total} casos en ${funcionalidades.length} suites`);
