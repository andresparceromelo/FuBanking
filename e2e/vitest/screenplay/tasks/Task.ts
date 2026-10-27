import { Actor } from '../actors/Actor';

/**
 * Interfaz base para todas las tareas (Tasks) del patrón Screenplay.
 *
 * Una tarea representa una acción de negocio de alto nivel que un
 * actor puede ejecutar, como "iniciar sesión" o "registrarse".
 */
export interface Task {
  /** Ejecuta la tarea usando las habilidades del actor proporcionado. */
  performAs(actor: Actor): Promise<void>;
}
