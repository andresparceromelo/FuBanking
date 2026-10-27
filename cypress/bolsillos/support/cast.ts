/**
 * Lo que cada actor del Gherkin (Ana, Bruno, Carlos…) sabe de sí mismo: sus
 * credenciales, su cuenta y los bolsillos que creó. Es el equivalente a las
 * notas del Screenplay de Serenity/JS. Se reinicia antes de cada escenario.
 *
 * Los datos se llenan dentro de callbacks `.then` de Cypress, así que solo se
 * deben leer dentro de otro `.then` (nunca al encolar los comandos).
 */
export interface Actor {
  name: string;
  email?: string;
  password?: string;
  token?: string;
  accountId?: string;
  /** nombre del bolsillo → id */
  pockets: Record<string, string>;
}

let actors: Record<string, Actor> = {};
let spotlight: Actor | undefined;
let lastResponse: Cypress.Response<any> | undefined;

export const Cast = {
  reset() {
    actors = {};
    spotlight = undefined;
    lastResponse = undefined;
  },

  /** Devuelve (o crea) el actor y lo pone en el foco, como `actorCalled`. */
  called(name: string): Actor {
    actors[name] ??= { name, pockets: {} };
    spotlight = actors[name];
    return spotlight;
  },

  /** El actor al que se refiere un pronombre (él, ella…). */
  inSpotlight(): Actor {
    if (!spotlight) {
      throw new Error('Ningún actor está en el foco: el escenario debe nombrar a alguien antes de usar un pronombre');
    }
    return spotlight;
  },

  /** Lee un dato de otro actor; falla con un mensaje claro si no lo tiene. */
  noteOf<K extends keyof Actor>(name: string, key: K): NonNullable<Actor[K]> {
    const value = actors[name]?.[key];
    if (value === undefined) {
      throw new Error(`${name} no tiene anotado "${String(key)}"`);
    }
    return value as NonNullable<Actor[K]>;
  },

  pocketId(actor: Actor, pocketName: string): string {
    const id = actor.pockets[pocketName];
    if (!id) {
      throw new Error(`${actor.name} no tiene anotado el bolsillo "${pocketName}"`);
    }
    return id;
  },

  rememberResponse(response: Cypress.Response<any>) {
    lastResponse = response;
  },

  lastResponse(): Cypress.Response<any> {
    if (!lastResponse) {
      throw new Error('El escenario todavía no hizo ninguna petición a la API');
    }
    return lastResponse;
  },
};
