import { Masked, Question } from '@serenity-js/core';

interface Secrets {
  password: string;
  token: string;
}

/**
 * Contraseña y token de cada actor, guardados fuera del Notepad: el reporte
 * imprime las notas completas y estos valores no deben quedar en la evidencia.
 */
const vault = new WeakMap<object, Secrets>();

export const Credentials = {
  keep(actor: object, secrets: Secrets): void {
    vault.set(actor, secrets);
  },

  /** Contraseña enmascarada: en el reporte aparece como "[a masked value]". */
  password: () =>
    Masked.valueOf(Question.about('su contraseña', actor => {
      const secrets = vault.get(actor);
      if (!secrets) {
        throw new Error(`${actor.name} no se ha registrado en este escenario`);
      }
      return secrets.password;
    })),
};
