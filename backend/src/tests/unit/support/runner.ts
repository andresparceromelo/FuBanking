/**
 * Arnés de las pruebas unitarias del módulo Bolsillos.
 *
 * No usa mocks, dobles ni stubs. Las unidades sin dependencias se instancian
 * directamente; los casos de uso reciben los repositorios Supabase reales.
 *
 * El arnés no aborta en el primer fallo: ejecuta todos los casos, registra el
 * resultado obtenido de cada uno y produce el reporte de la corrida.
 */

export type EstadoCaso = 'Aprobado' | 'Fallido';

/** Metadatos declarados de cada caso. */
export interface EspecificacionCaso {
  /** Identificador, p. ej. `PU-01` o `CU-CR-05`. */
  id: string;
  /** Grupo al que pertenece: "Entidad Pocket", "Crear bolsillo"… */
  grupo: string;
  /** Método o schema bajo prueba, p. ej. `Pocket.create`. */
  unidad: string;
  /** Qué comprueba el caso. */
  descripcion: string;
  /** Entrada concreta con la que se ejercita. */
  entrada: string;
  /** Resultado esperado según la regla de negocio. */
  esperado: string;
  /**
   * Identificador del defecto conocido que hace fallar este caso.
   * Se declara para que el fallo quede explicado en el reporte, pero el caso
   * se sigue contando como Fallido: un defecto documentado no es un aprobado.
   */
  defecto?: string;
}

export interface ResultadoCaso extends EspecificacionCaso {
  obtenido: string;
  estado: EstadoCaso;
  duracionMs: number;
}

/** La función de prueba devuelve la descripción del resultado obtenido. */
export type FuncionCaso = () => Promise<string> | string;

const resultados: ResultadoCaso[] = [];

/**
 * Ejecuta un caso y registra su resultado.
 * Un `throw` dentro de `fn` lo marca como Fallido con el mensaje del error,
 * que es exactamente el resultado obtenido que debe quedar documentado.
 */
export async function caso(spec: EspecificacionCaso, fn: FuncionCaso): Promise<void> {
  const inicio = Date.now();
  let obtenido: string;
  let estado: EstadoCaso;

  try {
    obtenido = await fn();
    estado = 'Aprobado';
  } catch (error: any) {
    obtenido = `FALLO: ${error?.message ?? String(error)}`;
    estado = 'Fallido';
  }

  resultados.push({ ...spec, obtenido, estado, duracionMs: Date.now() - inicio });
}

export function obtenerResultados(): ResultadoCaso[] {
  return resultados;
}


export function verificar(condicion: boolean, mensaje: string): void {
  if (!condicion) throw new Error(mensaje);
}

export function verificarIgual(actual: unknown, esperado: unknown, mensaje: string): void {
  if (actual !== esperado) {
    throw new Error(
      `${mensaje} (esperado: ${JSON.stringify(esperado)}, obtenido: ${JSON.stringify(actual)})`,
    );
  }
}

/**
 * Espera que la función SÍNCRONA lance un AppError con el código indicado.
 * Devuelve el texto del resultado obtenido, listo para el reporte.
 */
export function esperarCodigoSync(fn: () => unknown, codigoEsperado: string, mensaje: string): string {
  let resultado: unknown;
  try {
    resultado = fn();
  } catch (error: any) {
    const codigo = error?.code ?? 'SIN_CODIGO';
    if (codigo !== codigoEsperado) {
      throw new Error(`${mensaje} — se esperaba ${codigoEsperado} pero se obtuvo ${codigo}: ${error?.message}`);
    }
    return `Lanzó ${codigo} · HTTP ${error?.statusCode ?? 'n/a'} · "${error?.message}"`;
  }
  throw new Error(
    `${mensaje} — no lanzó ninguna excepción; devolvió ${JSON.stringify(resultado)}`,
  );
}

/** Espera que la promesa se rechace con un código de error concreto. */
export async function esperarCodigo(
  promesa: Promise<unknown>,
  codigoEsperado: string,
  mensaje: string,
): Promise<string> {
  let resultado: unknown;
  let capturado: any;
  let huboError = false;

  try {
    resultado = await promesa;
  } catch (error) {
    huboError = true;
    capturado = error;
  }

  if (!huboError) {
    throw new Error(
      `${mensaje} — la operación tuvo éxito cuando debía rechazarse; devolvió ${JSON.stringify(resultado)}`,
    );
  }

  const codigo = capturado?.code ?? 'SIN_CODIGO';
  if (codigo !== codigoEsperado) {
    throw new Error(
      `${mensaje} — se esperaba ${codigoEsperado} pero se obtuvo ${codigo}: ${capturado?.message}`,
    );
  }

  return `Rechazó con ${codigo} · HTTP ${capturado?.statusCode ?? 'n/a'} · "${capturado?.message}"`;
}

/** Formatea un valor monetario para los textos del reporte. */
export function pesos(valor: number): string {
  return `$${valor.toLocaleString('es-CO')}`;
}


export interface ResumenCorrida {
  total: number;
  aprobados: number;
  fallidos: number;
  porGrupo: Record<string, { total: number; aprobados: number; fallidos: number }>;
}

export function resumir(casos: ResultadoCaso[]): ResumenCorrida {
  const resumen: ResumenCorrida = {
    total: casos.length,
    aprobados: casos.filter((c) => c.estado === 'Aprobado').length,
    fallidos: casos.filter((c) => c.estado === 'Fallido').length,
    porGrupo: {},
  };

  for (const c of casos) {
    const bucket = resumen.porGrupo[c.grupo] ?? { total: 0, aprobados: 0, fallidos: 0 };
    bucket.total += 1;
    if (c.estado === 'Aprobado') bucket.aprobados += 1;
    else bucket.fallidos += 1;
    resumen.porGrupo[c.grupo] = bucket;
  }

  return resumen;
}
