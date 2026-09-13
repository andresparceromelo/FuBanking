/**
 * Arnés de las pruebas unitarias de caja blanca del módulo Bolsillos (frontend).
 *
 * Cada caso corresponde 1:1 con una fila de la TABLA DE CAMINOS del diagrama
 * `Frontend.drawio`: se declara el camino, la secuencia de nodos, las
 * condiciones que hay que forzar para recorrerla y las entradas que lo logran.
 *
 * No aborta en el primer fallo: ejecuta todos los caminos y registra el
 * resultado obtenido de cada uno.
 */

export type EstadoCamino = 'Aprobado' | 'Fallido' | 'No ejecutable';

export interface EspecificacionCamino {
  /** Identificador de la tabla, p. ej. `FE-CR-C1`. */
  id: string;
  /** Funcionalidad (hoja del diagrama): Crear, Actualizar, Eliminar… */
  funcionalidad: string;
  /** Handler bajo prueba, p. ej. `handleCreate`. */
  handler: string;
  /** Etiqueta del camino en la tabla. */
  camino: string;
  /** Secuencia de nodos tal como aparece en la tabla. */
  secuencia: string;
  /** Decisiones del grafo y el valor forzado en cada una. */
  condiciones: string[];
  /** Estado previo y entradas concretas que fuerzan el camino. */
  entradas: string[];
  /** Resultado esperado según el diagrama. */
  esperado: string;
}

export interface ResultadoCamino extends EspecificacionCamino {
  obtenido: string;
  estado: EstadoCamino;
  duracionMs: number;
}

export type FuncionCamino = () => Promise<string> | string;

const resultados: ResultadoCamino[] = [];

/** Ejecuta el caso de un camino y registra su resultado. */
export async function camino(spec: EspecificacionCamino, fn: FuncionCamino): Promise<void> {
  const inicio = Date.now();
  let obtenido: string;
  let estado: EstadoCamino;

  try {
    obtenido = await fn();
    estado = 'Aprobado';
  } catch (error: any) {
    obtenido = `FALLO: ${error?.message ?? String(error)}`;
    estado = 'Fallido';
  }

  resultados.push({ ...spec, obtenido, estado, duracionMs: Date.now() - inicio });
}

/**
 * Registra un camino que no puede recorrerse con el servicio HTTP real.
 * Queda documentado con el motivo en lugar de omitirse en silencio.
 */
export function caminoNoEjecutable(spec: EspecificacionCamino, motivo: string): void {
  resultados.push({ ...spec, obtenido: motivo, estado: 'No ejecutable', duracionMs: 0 });
}

export function obtenerCaminos(): ResultadoCamino[] {
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


export interface ResumenCaminos {
  total: number;
  aprobados: number;
  fallidos: number;
  noEjecutables: number;
  porFuncionalidad: Record<
    string,
    { total: number; aprobados: number; fallidos: number; noEjecutables: number }
  >;
}

export function resumirCaminos(casos: ResultadoCamino[]): ResumenCaminos {
  const resumen: ResumenCaminos = {
    total: casos.length,
    aprobados: casos.filter((c) => c.estado === 'Aprobado').length,
    fallidos: casos.filter((c) => c.estado === 'Fallido').length,
    noEjecutables: casos.filter((c) => c.estado === 'No ejecutable').length,
    porFuncionalidad: {},
  };

  for (const c of casos) {
    const b = resumen.porFuncionalidad[c.funcionalidad] ?? {
      total: 0,
      aprobados: 0,
      fallidos: 0,
      noEjecutables: 0,
    };
    b.total += 1;
    if (c.estado === 'Aprobado') b.aprobados += 1;
    else if (c.estado === 'Fallido') b.fallidos += 1;
    else b.noEjecutables += 1;
    resumen.porFuncionalidad[c.funcionalidad] = b;
  }

  return resumen;
}
