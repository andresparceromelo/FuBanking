import { AfterAll, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber';
import { Cast, configure, Duration, StageCrewMember, TakeNotes } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { CallAnApi } from '@serenity-js/rest';
import { Photographer, TakePhotosOfFailures, TakePhotosOfInteractions } from '@serenity-js/web';
import { Browser, chromium } from 'playwright';

import { ClientNotes } from '../../test/support/ClientNotes';
import { ensureSystemIsUp, environment } from '../../test/support/environment';

let browser: Browser | undefined;

// El primer acceso a cada ruta de Next en modo dev compila la página: margen amplio.
setDefaultTimeout(90_000);

BeforeAll(async () => {
  await ensureSystemIsUp();

  if (!environment.apiOnly) {
    browser = await chromium.launch({ headless: environment.headless });
  }

  const photographer: StageCrewMember[] = browser
    ? [Photographer.whoWill(environment.photosOfEveryInteraction ? TakePhotosOfInteractions : TakePhotosOfFailures)]
    : [];

  configure({
    // Cada actor (Ana, Bruno, Carlos…) llama a la API, toma notas y, si hay
    // navegador, abre su propio contexto de Playwright (sesión aislada).
    actors: Cast.where(actor => {
      actor.whoCan(
        // 30 s y no los 10 s por defecto: el backend escribe en Supabase y una
        // respuesta lenta al preparar datos comprometía escenarios sin relación.
        CallAnApi.using({ baseURL: environment.apiUrl, timeout: 30_000 }),
        TakeNotes.usingAnEmptyNotepad<ClientNotes>(),
      );
      if (browser) {
        actor.whoCan(BrowseTheWebWithPlaywright.using(
          browser,
          { baseURL: environment.webUrl, locale: 'es-CO' },
          // networkidle: espera a que Next termine de hidratar; si no, un clic
          // temprano envía el formulario de login de forma nativa.
          { defaultNavigationTimeout: 60_000, defaultNavigationWaitUntil: 'networkidle', defaultTimeout: 15_000 },
        ));
      }
      return actor;
    }),
    interactionTimeout: Duration.ofSeconds(15),
    crew: [
      '@serenity-js/console-reporter',
      ['@serenity-js/html-reporter', { specDirectory: './features' }],
      ...photographer,
    ],
  });
});

AfterAll(async () => {
  await browser?.close();
});
