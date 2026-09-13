/**
 * Generación del documento de registro de la corrida.
 *
 * Todo lo que aparece en el documento sale de la ejecución real: el resultado
 * obtenido de cada caso es lo que devolvió la unidad bajo prueba, no una
 * transcripción manual.
 */

import { ResultadoCaso, ResumenCorrida, resumir } from './runner';
import { ResultadoLimpieza } from './fixtures';

export interface MetadatosCorrida {
  fecha: string;
  version: string;
  entorno: string;
  usuario: string;
  limpieza: ResultadoLimpieza | null;
  notaParteB: string | null;
}

const ICONO: Record<string, string> = {
  Aprobado: '✅',
  Fallido: '❌',
};

/** Escapa un texto para usarlo dentro de una celda de tabla Markdown. */
function celda(texto: string): string {
  return String(texto).replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

export function generarMarkdown(casos: ResultadoCaso[], meta: MetadatosCorrida): string {
  const resumen: ResumenCorrida = resumir(casos);
  const L: string[] = [];

  L.push('# Registro de pruebas unitarias — Módulo Bolsillos (Backend)');
  L.push('');
  L.push('Documento generado automáticamente por `npm run test:unit`. El **resultado obtenido**');
  L.push('de cada caso proviene de la ejecución real de la unidad bajo prueba.');
  L.push('');
  L.push('La suite **no usa mocks, dobles ni stubs**. Las unidades sin dependencias se');
  L.push('instancian directamente; los casos de uso reciben los repositorios Supabase reales.');
  L.push('');
  L.push(`- **Fecha de ejecución:** ${meta.fecha}`);
  L.push(`- **Versión probada:** ${meta.version}`);
  L.push(`- **Entorno:** ${meta.entorno}`);
  L.push(`- **Usuario de la Parte B:** ${meta.usuario}`);
  L.push('- **Cómo reproducir:** `npm run test:unit` desde `backend/`');
  L.push('');

  if (meta.notaParteB) {
    L.push('> **Aviso.** ' + meta.notaParteB);
    L.push('');
  }

  L.push('## Resumen');
  L.push('');
  L.push('| Grupo | Casos | Aprobados | Fallidos |');
  L.push('| --- | ---: | ---: | ---: |');
  for (const [nombre, d] of Object.entries(resumen.porGrupo)) {
    L.push(`| ${nombre} | ${d.total} | ${d.aprobados} | ${d.fallidos} |`);
  }
  L.push(`| **Total** | **${resumen.total}** | **${resumen.aprobados}** | **${resumen.fallidos}** |`);
  L.push('');

  const conDefecto = casos.filter((c) => c.defecto);
  if (conDefecto.length > 0) {
    L.push(
      `De los ${resumen.fallidos} fallidos, ${conDefecto.filter((c) => c.estado === 'Fallido').length} ` +
        'corresponden a defectos ya identificados del código de producción, que por alcance no se corrigen ' +
        'en esta entrega. Se cuentan como fallidos: un defecto documentado no es un caso aprobado.',
    );
    L.push('');
  }

  L.push('## Índice de casos');
  L.push('');
  L.push('| ID | Grupo | Unidad | Estado | Defecto |');
  L.push('| --- | --- | --- | --- | --- |');
  for (const c of casos) {
    L.push(
      `| ${c.id} | ${celda(c.grupo)} | \`${celda(c.unidad)}\` | ${ICONO[c.estado]} ${c.estado} | ${c.defecto ?? '—'} |`,
    );
  }
  L.push('');

  const grupos = [...new Set(casos.map((c) => c.grupo))];
  for (const grupo of grupos) {
    const delGrupo = casos.filter((c) => c.grupo === grupo);
    L.push(`## ${grupo}`);
    L.push('');

    for (const c of delGrupo) {
      L.push(`### ${c.id} — ${c.descripcion}`);
      L.push('');
      L.push('| Campo | Contenido |');
      L.push('| --- | --- |');
      L.push(`| **Unidad bajo prueba** | \`${celda(c.unidad)}\` |`);
      L.push(`| **Entrada** | ${celda(c.entrada)} |`);
      L.push(`| **Resultado esperado** | ${celda(c.esperado)} |`);
      L.push(`| **Resultado obtenido** | ${celda(c.obtenido)} |`);
      L.push(`| **Estado** | ${ICONO[c.estado]} **${c.estado}** |`);
      if (c.defecto) L.push(`| **Defecto asociado** | ${c.defecto} |`);
      L.push(`| **Duración** | ${c.duracionMs} ms |`);
      L.push('');
    }
  }

  const fallidos = casos.filter((c) => c.estado === 'Fallido');
  L.push('## Casos fallidos');
  L.push('');
  if (fallidos.length === 0) {
    L.push('Ninguno: los ' + resumen.total + ' casos terminaron como se esperaba.');
  } else {
    for (const c of fallidos) {
      L.push(`### ❌ ${c.id} — ${c.grupo}${c.defecto ? ` · defecto ${c.defecto}` : ''}`);
      L.push('');
      L.push(`**Unidad:** \`${c.unidad}\``);
      L.push('');
      L.push(`**Entrada:** ${c.entrada}`);
      L.push('');
      L.push(`**Esperado:** ${c.esperado}`);
      L.push('');
      L.push(`**Obtenido:** ${c.obtenido}`);
      L.push('');
    }
  }
  L.push('');

  L.push('## Limpieza de la base de datos');
  L.push('');
  if (!meta.limpieza) {
    L.push('No se ejecutó: la Parte B no llegó a montar su escenario.');
  } else {
    const l = meta.limpieza;
    L.push('La suite borra al terminar todo lo que creó, dejando la base como estaba.');
    L.push('');
    L.push('| Tabla | Filas borradas |');
    L.push('| --- | ---: |');
    L.push(`| \`pockets\` | ${l.bolsillos} |`);
    L.push(`| \`notifications\` | ${l.notificaciones} |`);
    L.push(`| \`account_details\` | ${l.detalles} |`);
    L.push(`| \`accounts\` | ${l.cuentas} |`);
    L.push('');
    if (l.errores.length > 0) {
      L.push('**Errores durante la limpieza — quedaron filas sin borrar:**');
      L.push('');
      for (const err of l.errores) L.push(`- ${err}`);
      L.push('');
    }
  }

  L.push('---');
  L.push('');
  L.push('_Generado por `npm run test:unit`._');
  L.push('');

  return L.join('\n');
}


function esc(texto: unknown): string {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const ESTILOS = `
:root{--ground:#FBFAFC;--surface:#FFF;--surface-2:#F5F2F8;--ink:#1A1420;--ink-soft:#5C5566;
--ink-faint:#8B8496;--rule:#E6E1EC;--rule-strong:#D2C9DC;--accent:#820AD1;--accent-soft:#F4E9FD;
--accent-ink:#6A0AAB;--pass:#16714F;--pass-soft:#E3F3EC;--fail:#B32B45;--fail-soft:#FBE8EC;
--warn:#8F5A0A;--warn-soft:#FBF0DC;
--f-display:"IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;
--f-body:"IBM Plex Serif",Georgia,serif;--f-mono:"IBM Plex Mono",ui-monospace,Consolas,monospace;}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
--ground:#131019;--surface:#1B1624;--surface-2:#241D30;--ink:#ECE7F2;--ink-soft:#ADA4BB;
--ink-faint:#7C7389;--rule:#2E2739;--rule-strong:#443A53;--accent:#C079F5;--accent-soft:#2C1B3F;
--accent-ink:#D6A5FA;--pass:#56C79C;--pass-soft:#14302A;--fail:#F0839A;--fail-soft:#37161F;
--warn:#DCA850;--warn-soft:#34260F;}}
:root[data-theme="dark"]{--ground:#131019;--surface:#1B1624;--surface-2:#241D30;--ink:#ECE7F2;
--ink-soft:#ADA4BB;--ink-faint:#7C7389;--rule:#2E2739;--rule-strong:#443A53;--accent:#C079F5;
--accent-soft:#2C1B3F;--accent-ink:#D6A5FA;--pass:#56C79C;--pass-soft:#14302A;--fail:#F0839A;
--fail-soft:#37161F;--warn:#DCA850;--warn-soft:#34260F;}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--f-body);
font-size:16px;line-height:1.62;-webkit-font-smoothing:antialiased}
.wrap{max-width:940px;margin:0 auto;padding:44px 24px 96px}
.eyebrow{font-family:var(--f-mono);font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;
color:var(--accent-ink);margin:0 0 14px}
h1{font-family:var(--f-display);font-size:clamp(28px,4.2vw,42px);line-height:1.1;
letter-spacing:-.025em;font-weight:700;margin:0 0 18px;text-wrap:balance}
.standfirst{font-size:18px;color:var(--ink-soft);max-width:62ch;margin:0 0 28px}
.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1px;
background:var(--rule);border:1px solid var(--rule);border-radius:4px;overflow:hidden;margin-bottom:34px}
.meta div{background:var(--surface);padding:12px 14px}
.meta dt{font-family:var(--f-display);font-size:10.5px;font-weight:600;letter-spacing:.12em;
text-transform:uppercase;color:var(--ink-faint);margin:0 0 4px}
.meta dd{margin:0;font-family:var(--f-mono);font-size:13px;font-variant-numeric:tabular-nums}
h2{font-family:var(--f-display);font-size:23px;letter-spacing:-.018em;font-weight:600;
margin:48px 0 6px;padding-bottom:12px;border-bottom:2px solid var(--ink)}
h3{font-family:var(--f-display);font-size:15px;font-weight:600;margin:28px 0 10px}
p{margin:0 0 14px;max-width:68ch}
code{font-family:var(--f-mono);font-size:.87em;background:var(--surface-2);padding:1px 5px;
border-radius:3px}
.scroll{overflow-x:auto;margin:0 0 20px}
table{border-collapse:collapse;width:100%;font-family:var(--f-display);font-size:13.5px;min-width:520px}
th,td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--rule);vertical-align:top}
th{font-size:10.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
color:var(--ink-faint);border-bottom:1px solid var(--rule-strong);white-space:nowrap}
td.num,th.num{text-align:right;font-family:var(--f-mono);font-variant-numeric:tabular-nums}
.aviso{background:var(--warn-soft);border-left:3px solid var(--warn);border-radius:0 4px 4px 0;
padding:16px 18px;margin:0 0 28px}
.aviso b{display:block;font-family:var(--f-display);font-size:13px;letter-spacing:.04em;
text-transform:uppercase;color:var(--warn);margin-bottom:6px}
.aviso p{font-size:14.5px;margin:0}
.caso{background:var(--surface);border:1px solid var(--rule);border-left:3px solid var(--pass);
border-radius:4px;padding:16px 18px;margin:0 0 12px}
.caso.no{border-left-color:var(--fail)}
.caso-head{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;margin-bottom:10px}
.cid{font-family:var(--f-mono);font-size:11.5px;font-weight:600;color:var(--accent-ink);
background:var(--accent-soft);padding:2px 6px;border-radius:3px}
.ctit{font-family:var(--f-display);font-size:15.5px;font-weight:600;margin:0;flex:1 1 240px}
.badge{font-family:var(--f-display);font-size:9.5px;font-weight:700;letter-spacing:.1em;
text-transform:uppercase;padding:3px 7px;border-radius:3px}
.badge.ok{background:var(--pass-soft);color:var(--pass)}
.badge.no{background:var(--fail-soft);color:var(--fail)}
.badge.def{background:var(--fail-soft);color:var(--fail)}
.campo{margin:0 0 8px;font-size:14px}
.campo b{font-family:var(--f-display);font-size:10.5px;font-weight:600;letter-spacing:.12em;
text-transform:uppercase;color:var(--ink-faint);display:block;margin-bottom:2px}
.campo span{font-family:var(--f-mono);font-size:12.5px;line-height:1.55;display:block;
background:var(--surface-2);padding:7px 9px;border-radius:3px;word-break:break-word}
footer{border-top:1px solid var(--rule);margin-top:44px;padding-top:20px;color:var(--ink-faint);
font-size:13.5px}
@media print{.caso{break-inside:avoid}}
`;

export function generarHtml(casos: ResultadoCaso[], meta: MetadatosCorrida): string {
  const resumen = resumir(casos);
  const H: string[] = [];

  H.push('<title>Registro Unitario Bolsillos</title>');
  H.push('<link rel="preconnect" href="https://fonts.googleapis.com">');
  H.push('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
  H.push(
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?' +
      'family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;600;700&' +
      'family=IBM+Plex+Serif:wght@400;500&display=swap">',
  );
  H.push(`<style>${ESTILOS}</style>`);

  H.push('<div class="wrap">');
  H.push('<p class="eyebrow">Validación y Verificación · FuBank</p>');
  H.push('<h1>Registro de pruebas unitarias del módulo Bolsillos</h1>');
  H.push(
    '<p class="standfirst">Corrida generada automáticamente por <code>npm run test:unit</code>. ' +
      'El resultado obtenido de cada caso proviene de la ejecución real de la unidad bajo prueba. ' +
      'La suite no usa mocks, dobles ni stubs.</p>',
  );

  H.push('<dl class="meta">');
  H.push(`<div><dt>Fecha</dt><dd>${esc(meta.fecha)}</dd></div>`);
  H.push(`<div><dt>Versión</dt><dd>${esc(meta.version)}</dd></div>`);
  H.push(`<div><dt>Casos</dt><dd>${resumen.total}</dd></div>`);
  H.push(`<div><dt>Aprobados</dt><dd>${resumen.aprobados}</dd></div>`);
  H.push(`<div><dt>Fallidos</dt><dd>${resumen.fallidos}</dd></div>`);
  H.push('<div><dt>Dobles usados</dt><dd>0</dd></div>');
  H.push('</dl>');

  if (meta.notaParteB) {
    H.push('<div class="aviso"><b>La Parte B no se ejecutó</b><p>' + esc(meta.notaParteB) + '</p></div>');
  }

  H.push('<h2>Resumen por grupo</h2>');
  H.push('<div class="scroll"><table><thead><tr><th>Grupo</th><th class="num">Casos</th>');
  H.push('<th class="num">Aprobados</th><th class="num">Fallidos</th></tr></thead><tbody>');
  for (const [nombre, d] of Object.entries(resumen.porGrupo)) {
    H.push(
      `<tr><td>${esc(nombre)}</td><td class="num">${d.total}</td>` +
        `<td class="num">${d.aprobados}</td><td class="num">${d.fallidos}</td></tr>`,
    );
  }
  H.push(
    `<tr><td><b>Total</b></td><td class="num"><b>${resumen.total}</b></td>` +
      `<td class="num"><b>${resumen.aprobados}</b></td><td class="num"><b>${resumen.fallidos}</b></td></tr>`,
  );
  H.push('</tbody></table></div>');

  const grupos = [...new Set(casos.map((c) => c.grupo))];
  for (const grupo of grupos) {
    H.push(`<h2>${esc(grupo)}</h2>`);
    for (const c of casos.filter((x) => x.grupo === grupo)) {
      const fallo = c.estado === 'Fallido';
      H.push(`<div class="caso${fallo ? ' no' : ''}">`);
      H.push('<div class="caso-head">');
      H.push(`<span class="cid">${esc(c.id)}</span>`);
      H.push(`<h3 class="ctit">${esc(c.descripcion)}</h3>`);
      if (c.defecto) H.push(`<span class="badge def">Defecto ${esc(c.defecto)}</span>`);
      H.push(`<span class="badge ${fallo ? 'no' : 'ok'}">${esc(c.estado)}</span>`);
      H.push('</div>');
      H.push(`<div class="campo"><b>Unidad</b><span>${esc(c.unidad)}</span></div>`);
      H.push(`<div class="campo"><b>Entrada</b><span>${esc(c.entrada)}</span></div>`);
      H.push(`<div class="campo"><b>Esperado</b><span>${esc(c.esperado)}</span></div>`);
      H.push(`<div class="campo"><b>Obtenido</b><span>${esc(c.obtenido)}</span></div>`);
      H.push('</div>');
    }
  }

  H.push('<h2>Limpieza de la base de datos</h2>');
  if (!meta.limpieza) {
    H.push('<p>No se ejecutó: la Parte B no llegó a montar su escenario, así que no creó nada.</p>');
  } else {
    const l = meta.limpieza;
    H.push('<p>La suite borra al terminar todo lo que creó, dejando la base como estaba.</p>');
    H.push('<div class="scroll"><table><thead><tr><th>Tabla</th><th class="num">Filas borradas</th></tr></thead><tbody>');
    H.push(`<tr><td><code>pockets</code></td><td class="num">${l.bolsillos}</td></tr>`);
    H.push(`<tr><td><code>notifications</code></td><td class="num">${l.notificaciones}</td></tr>`);
    H.push(`<tr><td><code>account_details</code></td><td class="num">${l.detalles}</td></tr>`);
    H.push(`<tr><td><code>accounts</code></td><td class="num">${l.cuentas}</td></tr>`);
    H.push('</tbody></table></div>');
    if (l.errores.length > 0) {
      H.push('<div class="aviso"><b>Errores durante la limpieza</b><p>' + esc(l.errores.join(' · ')) + '</p></div>');
    }
  }

  H.push(
    '<footer><p>Documento regenerado en cada ejecución de <code>npm run test:unit</code>. ' +
      'No editar a mano: los cambios se pierden en la siguiente corrida.</p></footer>',
  );
  H.push('</div>');

  return H.join('\n');
}
