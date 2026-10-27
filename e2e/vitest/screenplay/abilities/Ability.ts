/**
 * Interfaz base para todas las habilidades (Abilities) del patrón Screenplay.
 *
 * Una habilidad representa una capacidad que se puede otorgar a un actor,
 * como navegar una página web o hacer llamadas HTTP a una API.
 */
export interface Ability {
  /** Identificador único de la habilidad para búsqueda en el actor. */
  readonly abilityName: string;
}
