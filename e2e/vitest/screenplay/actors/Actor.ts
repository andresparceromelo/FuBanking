import { Ability } from '../abilities/Ability';
import { Task } from '../tasks/Task';
import { Question } from '../questions/Question';

/**
 * Representa un usuario que interactúa con el sistema bajo prueba.
 *
 * El Actor es el componente central del patrón Screenplay. Posee
 * habilidades (Abilities) que le permiten ejecutar tareas (Tasks)
 * y formular preguntas (Questions) sobre el estado del sistema.
 *
 * @example
 * ```ts
 * const ana = Actor.named('Ana')
 *   .whoCan(CallApi.at('http://localhost:3001/api/v1'))
 *   .whoCan(BrowseTheWeb.at('http://localhost:3000'));
 *
 * await ana.attemptsTo(LoginWithCredentials.using('ana@example.com', 'Segura123!'));
 * const visible = await ana.asks(TheLoginErrorMessage.displayed());
 * ```
 */
export class Actor {
  private readonly abilities = new Map<string, Ability>();

  private constructor(private readonly name: string) {}

  /** Crea un nuevo actor con el nombre indicado. */
  static named(name: string): Actor {
    return new Actor(name);
  }

  /** Devuelve el nombre del actor. */
  getName(): string {
    return this.name;
  }

  /** Otorga una habilidad al actor. Permite encadenamiento. */
  whoCan(ability: Ability): this {
    this.abilities.set(ability.abilityName, ability);
    return this;
  }

  /**
   * Recupera una habilidad por su nombre.
   *
   * @throws Error si el actor no posee la habilidad solicitada.
   */
  abilityTo(abilityName: string): Ability {
    const ability = this.abilities.get(abilityName);

    if (!ability) {
      throw new Error(
        `El actor "${this.name}" no tiene la habilidad "${abilityName}". ` +
          `Habilidades disponibles: [${[...this.abilities.keys()].join(', ')}]`,
      );
    }

    return ability;
  }

  /**
   * Ejecuta una o más tareas en orden secuencial.
   *
   * Cada tarea recibe al actor como contexto para acceder a sus habilidades.
   */
  async attemptsTo(...tasks: Task[]): Promise<void> {
    for (const task of tasks) {
      await task.performAs(this);
    }
  }

  /**
   * Formula una pregunta sobre el estado del sistema.
   *
   * La pregunta usa las habilidades del actor para consultar el estado
   * actual y devuelve la respuesta tipada.
   */
  async asks<T>(question: Question<T>): Promise<T> {
    return question.answeredBy(this);
  }
}
