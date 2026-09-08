/**
 * Ejecutor de las pruebas unitarias de caja blanca del módulo Bolsillos (frontend).
 *
 *   npm run test:unit
 *
 * Recorre los 17 caminos de las tablas del diagrama `Frontend.drawio`: uno por
 * cada fila, ni más ni menos.
 *
 * El servicio bajo los handlers es el REAL (`pocketService` sobre axios) contra
 * el backend que esté corriendo en http://localhost:3001. Solo el API de toasts
 * y los setters de React se sustituyen por registradores, porque fuera de un
 * runtime de React con DOM no existe implementación real de esas dependencias.
 *
 * No escribe ningún documento: el resultado se imprime por consola.
 */

import { ejecutarCaminosActualizar } from './unit/actualizar.paths';
import { ejecutarCaminosConsultar } from './unit/consultar.paths';
import { ejecutarCaminosCrear } from './unit/crear.paths';
import { ejecutarCaminosEliminar } from './unit/eliminar.paths';
import { ejecutarCaminosTransferir } from './unit/transferir.paths';
import { montarEscenario } from './unit/support/entorno';
import { obtenerCaminos, resumirCaminos } from './unit/support/runner';

async function main(): Promise<void> {
  console.log('');
  console.log('Pruebas unitarias de caja blanca — Bolsillos (frontend)');
  console.log('Servicio HTTP real contra http://localhost:3001/api/v1');
  console.log('');

  let escenario;
  try {
    escenario = await montarEscenario();
  } catch (error: any) {
    console.error('No se pudo montar el escenario, así que no se ejecutó ningún camino.');
    console.error(`Motivo: ${error?.message ?? error}`);
    console.error('');
    console.error('Comprobaciones:');
    console.error('  1. ¿Está corriendo el backend?  cd backend && npm run dev');
    console.error('  2. ¿Existe la tabla `pockets` en Supabase?');
    console.error('  3. ¿Responde el health check?  curl -s http://localhost:3001/health');
    process.exit(1);
    return;
  }

  console.log(`Escenario montado · usuario ${escenario.correo} · cuenta ${escenario.accountId}`);

  await ejecutarCaminosCrear(escenario);
  await ejecutarCaminosActualizar(escenario);
  await ejecutarCaminosEliminar(escenario);
  await ejecutarCaminosTransferir(escenario);
  await ejecutarCaminosConsultar(escenario);

  // ── Salida ────────────────────────────────────────────────────────────────
  const casos = obtenerCaminos();
  const resumen = resumirCaminos(casos);

  let funcionalidadActual = '';
  for (const c of casos) {
    if (c.funcionalidad !== funcionalidadActual) {
      funcionalidadActual = c.funcionalidad;
      console.log('');
      console.log(`── ${funcionalidadActual} ${'─'.repeat(Math.max(0, 46 - funcionalidadActual.length))}`);
    }
    const marca = c.estado === 'Aprobado' ? 'OK   ' : c.estado === 'Fallido' ? 'FALLA' : 'N/E  ';
    console.log(`${marca} ${c.id.padEnd(11)} ${c.camino.padEnd(44)} ${c.secuencia}`);
    if (c.estado !== 'Aprobado') console.log(`      ↳ ${c.obtenido}`);
  }

  console.log('');
  for (const [nombre, d] of Object.entries(resumen.porFuncionalidad)) {
    console.log(
      `${nombre.padEnd(30)} ${d.aprobados}/${d.total} aprobados` +
        (d.fallidos ? `, ${d.fallidos} fallidos` : '') +
        (d.noEjecutables ? `, ${d.noEjecutables} no ejecutables` : ''),
    );
  }
  console.log('');
  console.log(
    `TOTAL: ${resumen.aprobados}/${resumen.total} aprobados, ${resumen.fallidos} fallidos` +
      (resumen.noEjecutables ? `, ${resumen.noEjecutables} no ejecutables` : ''),
  );

  if (resumen.fallidos > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('Error inesperado al ejecutar los caminos:', error);
  process.exit(1);
});
