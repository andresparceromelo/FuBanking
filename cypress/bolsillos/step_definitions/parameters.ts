import { Before, defineParameterType } from '@badeball/cypress-cucumber-preprocessor';

import { Cast } from '../support/cast';

// Mismos tipos de parámetro que la suite de Serenity/JS
// (`e2e/serenity/features/step-definitions/parameter.steps.ts`), para que los
// .feature se ejecuten sin cambios en los dos motores.

defineParameterType({
  name: 'actor',
  regexp: /[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/,
  transformer: (name: string) => Cast.called(name),
});

defineParameterType({
  name: 'pronoun',
  regexp: /él|ella|ellos|ellas/,
  transformer: () => Cast.inSpotlight(),
});

Before(() => {
  Cast.reset();
});
