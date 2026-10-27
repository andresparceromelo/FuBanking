import { Actor } from '../actors/Actor';

/**
 * Interfaz base para todas las preguntas (Questions) del patrón Screenplay.
 *
 * Una pregunta permite al actor consultar el estado actual del sistema
 * y obtener una respuesta tipada para las aserciones.
 *
 * @typeParam T - Tipo de la respuesta que devuelve la pregunta.
 */
export interface Question<T> {
  /** Obtiene la respuesta usando las habilidades del actor. */
  answeredBy(actor: Actor): Promise<T>;
}
