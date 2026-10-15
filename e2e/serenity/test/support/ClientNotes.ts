import { actorCalled, notes, Question, TakeNotes, UsesAbilities } from '@serenity-js/core';

/**
 * Lo que cada actor anota sobre sí mismo mientras se prepara y actúa.
 * La contraseña y el token no van aquí (ver `Credentials`): el reporte imprime las notas.
 */
export interface ClientNotes {
  email: string;
  accountId: string;
  /** Nombre del bolsillo → id, para poder referirse a ellos por nombre. */
  pockets: Record<string, string>;
}

export const clientNotes = () => notes<ClientNotes>();

function notepadOf(actor: UsesAbilities) {
  return (TakeNotes.as(actor) as TakeNotes<ClientNotes>).notepad;
}

export function rememberPocket(actor: UsesAbilities, name: string, id: string): void {
  const notepad = notepadOf(actor);
  const pockets = notepad.has('pockets') ? notepad.get('pockets') : {};
  notepad.set('pockets', { ...pockets, [name]: id });
}

/** Los bolsillos creados desde la pantalla no tienen id anotado: se ignoran. */
export function renamePocketInNotes(actor: UsesAbilities, from: string, to: string): void {
  const notepad = notepadOf(actor);
  if (!notepad.has('pockets') || !notepad.get('pockets')[from]) return;
  const { [from]: id, ...others } = notepad.get('pockets');
  notepad.set('pockets', { ...others, [to]: id });
}

export function forgetPocket(actor: UsesAbilities, name: string): void {
  const notepad = notepadOf(actor);
  if (!notepad.has('pockets')) return;
  const { [name]: _removed, ...others } = notepad.get('pockets');
  notepad.set('pockets', others);
}

/** Id de un bolsillo que el actor creó antes en el escenario. */
export const PocketId = {
  of: (name: string) => Question.about(`el id del bolsillo "${name}"`, async actor => {
    const pockets = notepadOf(actor).has('pockets') ? notepadOf(actor).get('pockets') : {};
    const id = pockets[name];
    if (!id) {
      throw new Error(`${actor.name} no tiene anotado un bolsillo llamado "${name}"`);
    }
    return id;
  }),
};

/**
 * Lee una nota de otro actor (p. ej. la cuenta de Bruno cuando Ana intenta
 * usarla). `actorCalled` mueve el foco, así que se devuelve al actor que actúa
 * para que los pasos siguientes ("la respuesta HTTP…") sigan hablando de él.
 */
export async function noteOf<K extends keyof ClientNotes>(
  ownerName: string,
  subject: K,
  requesterName: string,
): Promise<ClientNotes[K]> {
  const value = await actorCalled(ownerName).answer(clientNotes().get(subject));
  actorCalled(requesterName);
  return value as ClientNotes[K];
}
