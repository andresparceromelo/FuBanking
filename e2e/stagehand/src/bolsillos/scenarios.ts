import { z } from 'zod';

import { createClaudeSession, ClaudeSession } from './claude.config.js';
import { balanceOf, createPocket, newClient, pocketsOf, signInBrowser } from './fubankApi.js';
import { Scenario, ScenarioResult } from './report.js';
import {
  byName, openAccounts, openPockets, PocketsOnScreen, sawToast, waitForAccountBalance, waitForPocketAmount, waitForPocketCards,
} from './screen.js';

interface ScenarioDefinition {
  id: string;
  functionality: string;
  objective: string;
  expected: string;
  run: (s: Scenario, session: ClaudeSession) => Promise<void>;
}

/** Cada escenario tiene su navegador, su cliente y su sesión de Stagehand. */
export async function runScenario(definition: ScenarioDefinition): Promise<ScenarioResult> {
  const session = await createClaudeSession();
  const scenario = new Scenario(session, definition.id, definition.functionality, definition.objective, definition.expected);
  try {
    await definition.run(scenario, session);
    return await scenario.finish();
  } catch (error) {
    console.error(`  \x1b[31m✗ ${(error as Error).message}\x1b[0m`);
    return await scenario.finish(error);
  } finally {
    await session.browser.close();
  }
}

export const scenarios: ScenarioDefinition[] = [
  {
    id: 'SH-B01',
    functionality: 'Crear bolsillo',
    objective: 'La IA crea un bolsillo desde la pantalla siguiendo instrucciones en lenguaje natural.',
    expected: 'Toast "Bolsillo creado", tarjeta "Vacaciones" con 100.000 y saldo de la cuenta en 400.000 (de 500.000).',
    async run(s, session) {
      const ana = await newClient('Ana', 500_000);
      await signInBrowser(session, ana);
      await openPockets(session);
      await s.screenshot('inicio');

      const form = await s.observe('Find the "Crear bolsillo" button of the "Nuevo bolsillo" form');
      const createButton = form.find(element => /crear/i.test(element.description));
      s.verify('observe encuentra el botón "Crear bolsillo"', true, createButton !== undefined);

      await s.act('Type "Vacaciones" into the "Nombre del bolsillo" input');
      await s.act('Type "100000" into the "Monto inicial" input');
      // Se reutiliza la acción observada: no hace falta otra llamada al modelo.
      await s.act(createButton!);

      s.verify('notificación "Bolsillo creado"', true, await sawToast(session, 'Bolsillo creado'));
      await waitForPocketCards(session, 1);
      await s.screenshot('resultado');

      const shown = await s.extract('Extract every pocket card listed under "Bolsillos actuales" with its name and amount', PocketsOnScreen);
      s.verify('bolsillos en pantalla (extract)', [{ name: 'Vacaciones', amount: 100_000 }], byName(shown.pockets));
      s.verify('bolsillos en el backend (API)', [{ name: 'Vacaciones', amount: 100_000 }], byName(await pocketsOf(ana)));
      s.verify('saldo de la cuenta en el backend (API)', 400_000, await balanceOf(ana));
    },
  },
  {
    id: 'SH-B02',
    functionality: 'Consultar bolsillos',
    objective: 'La IA lee los bolsillos de la cuenta y descubre las acciones disponibles en cada tarjeta.',
    expected: 'Extrae "Mercado" 50.000 y "Vacaciones" 100.000, igual que la API, y encuentra Editar y Eliminar.',
    async run(s, session) {
      const ana = await newClient('Ana', 500_000);
      await createPocket(ana, 'Vacaciones', 100_000);
      await createPocket(ana, 'Mercado', 50_000);
      await signInBrowser(session, ana);
      await openPockets(session);
      await waitForPocketCards(session, 2);
      await s.screenshot('lista');

      const shown = await s.extract('Extract every pocket card listed under "Bolsillos actuales" with its name and amount', PocketsOnScreen);
      const expected = [{ name: 'Mercado', amount: 50_000 }, { name: 'Vacaciones', amount: 100_000 }];
      s.verify('bolsillos en pantalla (extract)', expected, byName(shown.pockets));
      s.verify('la pantalla coincide con el backend (API)', byName(await pocketsOf(ana)), byName(shown.pockets));

      const actions = await s.observe('Find the "Editar" and "Eliminar" buttons of the pocket cards');
      const descriptions = actions.map(action => action.description.toLowerCase());
      s.verify('observe encuentra botones Editar', true, descriptions.some(d => d.includes('editar')));
      s.verify('observe encuentra botones Eliminar', true, descriptions.some(d => d.includes('eliminar')));
    },
  },
  {
    id: 'SH-B03',
    functionality: 'Editar bolsillo',
    objective: 'La IA renombra un bolsillo y aumenta su monto desde el formulario de edición.',
    expected: 'Toast "Bolsillo actualizado", bolsillo "Viaje a Cartagena" con 150.000 y saldo de la cuenta en 350.000.',
    async run(s, session) {
      const ana = await newClient('Ana', 500_000);
      await createPocket(ana, 'Vacaciones', 100_000);
      await signInBrowser(session, ana);
      await openPockets(session);
      await waitForPocketCards(session, 1);

      await s.act('Click the "Editar" button of the "Vacaciones" pocket card');
      await s.act('Fill the "Nombre" input of the pocket being edited with "Viaje a Cartagena"');
      await s.act('Fill the "Monto" input of the pocket being edited with "150000"');
      await s.screenshot('edicion');
      await s.act('Click the "Guardar" button of the pocket being edited');

      s.verify('notificación "Bolsillo actualizado"', true, await sawToast(session, 'Bolsillo actualizado'));
      await s.screenshot('resultado');

      const shown = await s.extract('Extract every pocket card listed under "Bolsillos actuales" with its name and amount', PocketsOnScreen);
      s.verify('bolsillos en pantalla (extract)', [{ name: 'Viaje a Cartagena', amount: 150_000 }], byName(shown.pockets));
      s.verify('bolsillos en el backend (API)', [{ name: 'Viaje a Cartagena', amount: 150_000 }], byName(await pocketsOf(ana)));
      s.verify('la diferencia sale de la cuenta (API)', 350_000, await balanceOf(ana));
    },
  },
  {
    id: 'SH-B04',
    functionality: 'Eliminar bolsillo',
    objective: 'La IA elimina un bolsillo pasando por el diálogo de confirmación.',
    expected: 'Toast "Bolsillo eliminado", mensaje de lista vacía y el saldo vuelve a 500.000.',
    async run(s, session) {
      const ana = await newClient('Ana', 500_000);
      await createPocket(ana, 'Vacaciones', 100_000);
      await signInBrowser(session, ana);
      await openPockets(session);
      await waitForPocketCards(session, 1);

      await s.act('Click the "Eliminar" button of the "Vacaciones" pocket card');
      const dialog = await s.observe('Find the button that confirms the deletion in the "Eliminar bolsillo" dialog');
      const confirm = dialog.find(element => /s[ií],?\s*eliminar/i.test(element.description)) ?? dialog[0];
      s.verify('observe encuentra la confirmación "Sí, eliminar"', true, confirm !== undefined);
      await s.screenshot('confirmacion');
      await s.act(confirm!);

      s.verify('notificación "Bolsillo eliminado"', true, await sawToast(session, 'Bolsillo eliminado'));
      await waitForPocketCards(session, 0);
      await s.screenshot('resultado');

      const screen = await s.extract('Extract how many pocket cards are listed under "Bolsillos actuales" and the empty-state message, if any',
        z.object({
          pocketCount: z.number().describe('Cantidad de tarjetas de bolsillo visibles'),
          emptyMessage: z.string().describe('Mensaje que indica que no hay bolsillos, o cadena vacía'),
        }));
      s.verify('no quedan tarjetas en pantalla (extract)', 0, screen.pocketCount);
      s.verify('mensaje de lista vacía (extract)', true, /no hay bolsillos/i.test(screen.emptyMessage));
      s.verify('el backend no tiene bolsillos (API)', [], await pocketsOf(ana));
      s.verify('el saldo vuelve a la cuenta (API)', 500_000, await balanceOf(ana));
    },
  },
  {
    id: 'SH-B05',
    functionality: 'Transferir entre bolsillos',
    objective: 'La IA mueve dinero de un bolsillo a otro con el formulario de transferencia.',
    expected: 'Toast "Transferencia realizada", Vacaciones 70.000, Mercado 80.000 y la cuenta sigue en 350.000.',
    async run(s, session) {
      const ana = await newClient('Ana', 500_000);
      await createPocket(ana, 'Vacaciones', 100_000);
      await createPocket(ana, 'Mercado', 50_000);
      await signInBrowser(session, ana);
      await openPockets(session);
      await waitForPocketCards(session, 2);

      await s.act('Select the option that starts with "Vacaciones" in the "Bolsillo origen" dropdown');
      await s.act('Select the option that starts with "Mercado" in the "Bolsillo destino" dropdown');
      await s.act('Type "30000" into the "Monto" input of the "Transferir entre bolsillos" form');
      await s.screenshot('formulario');
      await s.act('Click the "Transferir" button');

      s.verify('notificación "Transferencia realizada"', true, await sawToast(session, 'Transferencia realizada'));
      await waitForPocketAmount(session, 'Vacaciones', 70_000);
      await waitForPocketAmount(session, 'Mercado', 80_000);
      await s.screenshot('resultado');

      const expected = [{ name: 'Mercado', amount: 80_000 }, { name: 'Vacaciones', amount: 70_000 }];
      const shown = await s.extract('Extract every pocket card listed under "Bolsillos actuales" with its name and amount', PocketsOnScreen);
      s.verify('bolsillos en pantalla (extract)', expected, byName(shown.pockets));
      s.verify('bolsillos en el backend (API)', expected, byName(await pocketsOf(ana)));
      s.verify('la transferencia no toca la cuenta (API)', 350_000, await balanceOf(ana));
    },
  },
  {
    id: 'SH-D06',
    functionality: 'Depositar dinero',
    objective: 'La IA abona saldo a la cuenta; antes comprueba que el formulario rechaza un monto en cero.',
    expected: 'Con 0: error "Por favor ingresa un monto válido mayor a cero." y saldo 0. Con 150.000: toast "Deposito realizado" y saldo 150.000.',
    async run(s, session) {
      const carlos = await newClient('Carlos', 0);
      await signInBrowser(session, carlos);
      await openAccounts(session);
      await s.screenshot('inicio');

      const buttons = await s.observe('Find the "Abonar" button of the account card');
      const deposit = buttons.find(element => /abonar/i.test(element.description));
      s.verify('observe encuentra el botón "Abonar"', true, deposit !== undefined);
      await s.act(deposit!);

      // Camino de error: monto en cero.
      await s.act('Type "0" into the "Monto a ingresar (COP)" input');
      await s.act('Click the "Abonar Saldo" button');
      const error = await s.extract('Extract the validation error message shown in the deposit form',
        z.object({ message: z.string().describe('Texto exacto del mensaje de error del formulario') }));
      await s.screenshot('error-monto-cero');
      s.verify('mensaje de error (extract)', 'Por favor ingresa un monto válido mayor a cero.', error.message.trim());
      s.verify('el saldo no cambia (API)', 0, await balanceOf(carlos));

      // Camino exitoso.
      await s.act('Fill the "Monto a ingresar (COP)" input with "150000"');
      await s.act('Click the "Abonar Saldo" button');
      s.verify('notificación "Deposito realizado"', true, await sawToast(session, 'Deposito realizado'));
      await waitForAccountBalance(session, 150_000);
      await s.screenshot('resultado');

      const card = await s.extract('Extract the balance shown in the account card',
        z.object({ balance: z.number().describe('Saldo de la cuenta como número entero en pesos, sin "$" ni separadores') }));
      s.verify('saldo en pantalla (extract)', 150_000, card.balance);
      s.verify('saldo en el backend (API)', 150_000, await balanceOf(carlos));
    },
  },
];
