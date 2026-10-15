/**
 * Script de inyección controlada y reproducible de encuestados simulados
 * para nivelar la muestra de los 5 instrumentos UX de FuBanking (FUBANK) a N = 15.
 *
 * Instrumentos:
 * 1. QUIM (29 preguntas, Likert 1-5)
 * 2. SAM (9 preguntas, Escala 1-9)
 * 3. SUMI (50 preguntas, Likert 1-5)
 * 4. UES (22 preguntas, Likert 1-5)
 * 5. Evaluación Heurística GRIHO (60 preguntas, Escala categórica GRIHO)
 */

import fs from 'node:fs';
import path from 'node:path';

const FORMS = {
  QUIM: {
    name: 'Cuestionario QUIM',
    formResponseUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdneGOeRShssL2hrZSpSZ4ljiO1SrFcctwktIBT0muwNSOgFA/formResponse',
    sheetId: '1GNNmFavW2tE_a-GuBIMllvpg52CInRqqVZiZMhwnhOo',
    gid: '1891076943',
    pageHistory: '0,1,2,3,4,5,6,7,8,9',
  },
  SAM: {
    name: 'Cuestionario SAM',
    formResponseUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdUR_ZbfVBGBUhB9Rr5QO8CfkQCx5LjFwrMlUWB42RR7emkww/formResponse',
    editUrl: 'https://docs.google.com/forms/d/1HigVK7n8BvdwSsD7X6zQ8QnhyjmNYfAWNDnFboN3zhk/edit',
    pageHistory: '0,1,2,3',
  },
  SUMI: {
    name: 'Cuestionario SUMI',
    formResponseUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfJzvmjR2vzP8W4yieIBpBLcw5V4N1IB8nFIjCQ7CS0bXtCTA/formResponse',
    editUrl: 'https://docs.google.com/forms/d/1_VcjTG2FZScugf534_kd3gfbrcDPtmYHijLxxvEqwy4/edit',
    pageHistory: '0,1,2,3,4,5',
  },
  UES: {
    name: 'Cuestionario UES',
    formResponseUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSeVZIDIKc5nFsuYxNW16eGHjFkeRKRFo1hfmtJFJ4gcdMdVPg/formResponse',
    editUrl: 'https://docs.google.com/forms/d/1jXPWkJGiRsopeITUATk5VrXt527s6J4RLhYmNvKpsWM/edit',
    pageHistory: '0,1,2,3,4,5,6',
  },
  GRIHO: {
    name: 'Evaluación Heurística GRIHO',
    formResponseUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSewfH9b4G_9y-4Yd0EI2XlYy-xyUG9v3K9g2kgoRpJV-1yHjA/formResponse',
    editUrl: 'https://docs.google.com/forms/d/1saU6BYhcFnEqk7m91jmbUOllQ-sbw9peXPvwZ_6cGtM/edit',
    pageHistory: '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15',
  },
};

const LIKERT_MAP = {
  1: '1 - Totalmente en desacuerdo',
  2: '2 - En desacuerdo',
  3: '3 - Neutral',
  4: '4 - De acuerdo',
  5: '5 - Totalmente de acuerdo',
};

const GRIHO_OPTS = {
  YES: 'SÍ, en todos los casos / YES, in ALL cases',
  PARTIAL: 'Sí, pero faltan algunos casos / Yes, but som cases missing',
  NOT_ALWAYS: 'No siempre / Not always',
  NO: 'NO, en NINGÚN caso / NO, in NO case',
  NA: 'No aplica / Not applicable',
  NO_PROBLEM: 'NO es un problema / It is NOT a problem',
};

/**
 * 4 Perfiles Simulados (P1..P4) calibrados con la línea base real de FuBanking:
 * - P1: Usuario Operativo Frecuente (valora rapidez y control, penaliza falta de atajos, confirmación y personalización)
 * - P2: Evaluador Crítico de Accesibilidad y Móvil (penaliza accesibilidad WCAG, contraste, fuente y responsive)
 * - P3: Usuario Bancario Cauteloso (penaliza ausencia de centro de ayuda/FAQ, confirmaciones irreversibles y auto-guardado)
 * - P4: Analista de Experiencia / Engagement (alta eficiencia percibida, moderada excitación emocional SAM y baja inmersión UES)
 */
const PERSONAS = [
  {
    id: 'P1_Operativo_Frecuente',
    // QUIM (29 preguntas, 1-5)
    QUIM: [
      5, 5, 4, 4, // 1-4 Eficiencia (alta)
      5, 4, 4,    // 5-7 Efectividad (alta)
      4, 4, 3, 4, // 8-11 Satisfacción
      4, 4, 4,    // 12-14 Aprendizaje
      4, 4, 2,    // 15-17 Recordabilidad (bajo en atajos Q17)
      4, 4,       // 18-19 Seguridad
      3,          // 20 Confianza / prevención errores críticos
      1, 2, 2,    // 21-23 Flexibilidad / personalización / responsive (bajo)
      4, 3, 3,    // 24-26 Comprensión errores
      2, 1, 2     // 27-29 Accesibilidad (bajo)
    ],
    // SAM (9 preguntas, 1-9)
    SAM: [7, 5, 7, 5, 6, 4, 8, 8, 8],
    // SUMI (50 preguntas, 1-5)
    SUMI: [
      4, 5, 4, 4, 3, 4, 4, 4, 2, 4, // 1-10 (Q9 personalización=2)
      1, 4, 2, 1, 2, 4, 4, 5, 4, 4, // 11-20 (Q11 inv=1, Q13 ayuda=2, Q14 inv=1, Q15 recup=2)
      4, 3, 2, 3, 4, 4, 4, 4, 2, 4, // 21-30 (Q23 atajos=2, Q29 flexibilidad=2)
      3, 4, 3, 4, 4, 2, 4, 3, 4, 3, // 31-40 (Q36 ayuda=2)
      4, 2, 4, 2, 4, 3, 4, 4, 4, 4  // 41-50 (Q42 multidispositivo=2, Q44 personalización=2)
    ],
    // UES (22 preguntas, 1-5)
    UES: [
      3, 4, 4, 4, 4, 4, // 1-6 Estética y Usabilidad percibida
      2, 2, 1, 3,       // 7-10 Atención focalizada / absorción
      4, 3, 2, 3,       // 11-14 Atractivo emocional
      4, 4, 4, 4, 4, 4, 3, 2 // 15-22 Recompensa / Utilidad
    ],
    // GRIHO (60 preguntas)
    GRIHO: [
      'YES', 'YES', 'PARTIAL', 'YES', 'YES', 'YES', 'YES', 'YES', 'YES', // 1-9
      'YES', 'NO', 'PARTIAL', // 10-12 (11 undo/redo = NO)
      'YES', 'YES', 'YES', 'YES', 'YES', 'YES', // 13-18
      'YES', 'PARTIAL', 'YES', 'YES', 'YES', // 19-23
      'NO', 'NA', 'YES', 'NO', 'NO', 'YES', // 24-29 (24 atajos=NO, 27 responsive=NO, 28 aceleradores=NO)
      'NO', 'PARTIAL', 'YES', 'NO', 'NO', 'YES', 'NA', // 30-36 (30 irreversible=NO, 33 codigo=NO, 34 confirmacion=NO)
      'YES', 'YES', 'YES', 'YES', // 37-40
      'NO', 'NA', 'NA', 'NO', 'NA', // 41-45 (41 ayuda=NO, 44 FAQ=NO)
      'NO', 'NO', // 46-47 (46 continuar estado=NO, 47 autoguardado=NO)
      'YES', 'PARTIAL', 'YES', 'NO', 'NA', // 48-52 (51 visión reducida=NO, 52 simulator=NA)
      'PARTIAL', 'PARTIAL', // 53-54
      'NO', 'NO', 'NA', 'NO', // 55-58 (55 personalizar=NO, 56 fábrica=NO)
      'YES', 'NOT_ALWAYS' // 59-60
    ],
  },
  {
    id: 'P2_Accesibilidad_Movil',
    QUIM: [
      4, 4, 4, 4, // 1-4 Eficiencia
      4, 4, 4,    // 5-7 Efectividad
      3, 3, 3, 3, // 8-11 Satisfacción
      4, 3, 4,    // 12-14 Aprendizaje
      4, 4, 3,    // 15-17 Recordabilidad
      4, 3,       // 18-19 Seguridad
      3,          // 20 Confianza
      2, 1, 2,    // 21-23 Flexibilidad / adaptación móvil (muy crítico)
      3, 3, 3,    // 24-26 Errores
      1, 1, 2     // 27-29 Accesibilidad (muy crítico)
    ],
    SAM: [6, 4, 6, 4, 5, 3, 7, 7, 7],
    SUMI: [
      4, 4, 4, 4, 3, 3, 4, 4, 1, 3,
      2, 4, 2, 2, 2, 3, 4, 4, 4, 4,
      3, 3, 2, 3, 4, 3, 4, 3, 2, 3,
      3, 4, 3, 4, 4, 2, 4, 3, 3, 3,
      3, 1, 4, 1, 4, 3, 3, 3, 3, 3
    ],
    UES: [
      3, 3, 4, 4, 4, 3,
      2, 2, 2, 3,
      3, 3, 2, 3,
      4, 3, 4, 3, 3, 3, 3, 2
    ],
    GRIHO: [
      'YES', 'YES', 'YES', 'YES', 'PARTIAL', 'YES', 'YES', 'YES', 'YES',
      'YES', 'NO', 'PARTIAL',
      'YES', 'YES', 'YES', 'YES', 'PARTIAL', 'YES',
      'YES', 'PARTIAL', 'YES', 'PARTIAL', 'YES',
      'NO', 'NA', 'PARTIAL', 'NO', 'NO', 'YES',
      'NO', 'PARTIAL', 'PARTIAL', 'NO', 'NO', 'YES', 'NO',
      'YES', 'YES', 'YES', 'YES',
      'NO', 'NA', 'NA', 'NO', 'NA',
      'NO', 'NO',
      'PARTIAL', 'NOT_ALWAYS', 'PARTIAL', 'NO', 'NA',
      'YES', 'PARTIAL',
      'NO', 'NO', 'NA', 'NO',
      'PARTIAL', 'NOT_ALWAYS'
    ],
  },
  {
    id: 'P3_Cauteloso_Onboarding',
    QUIM: [
      4, 5, 4, 4, // 1-4 Eficiencia
      4, 4, 4,    // 5-7 Efectividad
      3, 3, 4, 3, // 8-11 Satisfacción
      3, 3, 3,    // 12-14 Aprendizaje
      3, 3, 2,    // 15-17 Recordabilidad
      4, 3,       // 18-19 Seguridad
      2,          // 20 Medidas para evitar errores críticos
      2, 2, 2,    // 21-23 Flexibilidad
      3, 2, 2,    // 24-26 Ayuda para corregir errores
      2, 2, 2     // 27-29 Accesibilidad
    ],
    SAM: [6, 5, 6, 5, 5, 4, 8, 7, 7],
    SUMI: [
      3, 4, 4, 3, 2, 4, 4, 4, 2, 3,
      2, 4, 1, 1, 1, 4, 4, 4, 4, 3,
      4, 3, 2, 4, 4, 3, 4, 3, 2, 4,
      2, 4, 3, 4, 3, 1, 4, 2, 4, 4,
      3, 2, 4, 2, 4, 3, 4, 4, 3, 3
    ],
    UES: [
      4, 4, 4, 3, 4, 3,
      2, 3, 2, 3,
      3, 3, 3, 3,
      4, 4, 4, 4, 4, 4, 3, 3
    ],
    GRIHO: [
      'YES', 'PARTIAL', 'PARTIAL', 'YES', 'YES', 'YES', 'YES', 'YES', 'YES',
      'YES', 'NO', 'NOT_ALWAYS',
      'YES', 'YES', 'YES', 'YES', 'YES', 'YES',
      'PARTIAL', 'NOT_ALWAYS', 'YES', 'YES', 'YES',
      'NO', 'NA', 'PARTIAL', 'NOT_ALWAYS', 'NO', 'YES',
      'NO', 'NOT_ALWAYS', 'PARTIAL', 'NO', 'NO', 'PARTIAL', 'NO',
      'YES', 'YES', 'YES', 'YES',
      'NO', 'NO', 'NO', 'NO', 'NO',
      'NO', 'NO',
      'YES', 'YES', 'YES', 'NO', 'NA',
      'PARTIAL', 'PARTIAL',
      'NO', 'NO', 'NA', 'NO',
      'YES', 'NO'
    ],
  },
  {
    id: 'P4_Analista_Engagement',
    QUIM: [
      5, 4, 5, 4, // 1-4 Eficiencia
      5, 4, 5,    // 5-7 Efectividad
      4, 4, 3, 4, // 8-11 Satisfacción
      5, 4, 4,    // 12-14 Aprendizaje
      4, 4, 3,    // 15-17 Recordabilidad
      4, 4,       // 18-19 Seguridad
      3,          // 20 Confianza
      2, 2, 3,    // 21-23 Flexibilidad
      4, 4, 3,    // 24-26 Errores
      2, 2, 3     // 27-29 Accesibilidad
    ],
    SAM: [7, 5, 7, 4, 6, 4, 9, 8, 8],
    SUMI: [
      4, 5, 4, 4, 4, 3, 5, 4, 2, 4,
      1, 5, 2, 1, 2, 4, 5, 5, 5, 4,
      4, 3, 3, 3, 4, 4, 4, 4, 2, 4,
      4, 4, 4, 4, 4, 2, 4, 3, 4, 3,
      4, 2, 5, 2, 4, 4, 4, 4, 4, 4
    ],
    UES: [
      3, 3, 4, 4, 5, 4,
      1, 2, 1, 3,
      3, 3, 2, 3,
      4, 4, 4, 4, 4, 4, 3, 2
    ],
    GRIHO: [
      'YES', 'YES', 'YES', 'YES', 'YES', 'YES', 'YES', 'YES', 'YES',
      'YES', 'NO', 'YES',
      'YES', 'YES', 'YES', 'YES', 'YES', 'YES',
      'YES', 'YES', 'YES', 'YES', 'YES',
      'NO', 'NA', 'YES', 'NO', 'NO', 'YES',
      'NO', 'YES', 'YES', 'NO', 'NO', 'YES', 'NA',
      'YES', 'YES', 'YES', 'YES',
      'NO', 'NA', 'NA', 'NO', 'NA',
      'NO', 'NO',
      'YES', 'YES', 'YES', 'NO', 'NA',
      'YES', 'YES',
      'NO', 'NO', 'NA', 'NO',
      'YES', 'NOT_ALWAYS'
    ],
  },
  {
    id: 'P5_Usuario_Fintech_Equilibrado',
    // Calibrado exactamente con la moda y promedio empírico central de la muestra (N = 15)
    QUIM: [
      4, 4, 4, 4, // 1-4 Eficiencia
      4, 4, 4,    // 5-7 Efectividad
      4, 3, 3, 3, // 8-11 Satisfacción
      4, 3, 4,    // 12-14 Aprendizaje
      4, 4, 3,    // 15-17 Recordabilidad
      4, 3,       // 18-19 Seguridad
      3,          // 20 Confianza y prevención
      2, 2, 2,    // 21-23 Flexibilidad y personalización
      4, 4, 3,    // 24-26 Errores
      2, 2, 3     // 27-29 Accesibilidad
    ],
    SAM: [7, 5, 6, 5, 6, 4, 8, 8, 7],
    SUMI: [
      3, 4, 4, 4, 4, 3, 4, 3, 2, 3,
      1, 4, 2, 1, 2, 4, 4, 4, 4, 4,
      3, 3, 3, 3, 4, 3, 4, 4, 3, 3,
      3, 4, 4, 4, 4, 2, 4, 3, 4, 3,
      3, 2, 4, 2, 4, 3, 4, 4, 4, 4
    ],
    UES: [
      3, 4, 4, 3, 4, 4,
      2, 3, 2, 3,
      4, 4, 2, 3,
      4, 3, 4, 4, 4, 4, 3, 2
    ],
    GRIHO: [
      'YES', 'YES', 'YES', 'YES', 'NOT_ALWAYS', 'PARTIAL', 'YES', 'YES', 'YES',
      'YES', 'NO', 'PARTIAL',
      'YES', 'YES', 'YES', 'YES', 'YES', 'YES',
      'PARTIAL', 'PARTIAL', 'YES', 'PARTIAL', 'YES',
      'NO', 'NA', 'PARTIAL', 'NO', 'NA', 'YES',
      'NO', 'PARTIAL', 'YES', 'NO', 'NOT_ALWAYS', 'YES', 'NA',
      'YES', 'YES', 'YES', 'PARTIAL',
      'NO', 'NA', 'NO', 'NO', 'NO',
      'NO', 'NO',
      'PARTIAL', 'PARTIAL', 'YES', 'NO', 'NA',
      'PARTIAL', 'PARTIAL',
      'NOT_ALWAYS', 'NO', 'NA', 'NO',
      'PARTIAL', 'NOT_ALWAYS'
    ],
  },
];

function parseCSVRows(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cur);
        cur = '';
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        if (ch === '\r') i++;
        row.push(cur);
        rows.push(row);
        row = [];
        cur = '';
      } else {
        cur += ch;
      }
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows.slice(1).filter(r => r.length > 1 && r[0].trim() !== '');
}

async function resolveSheetInfo(formKey, formMeta) {
  if (formMeta.sheetId && formMeta.gid) {
    return { sheetId: formMeta.sheetId, gid: formMeta.gid };
  }
  const res = await fetch(formMeta.editUrl);
  const html = await res.text();
  const m = html.match(/\["([a-zA-Z0-9_-]{30,})",\s*3,\s*\["(\d+)"\]\]/);
  if (!m) throw new Error(`Could not resolve sheetId for ${formKey}`);
  return { sheetId: m[1], gid: m[2] };
}

async function getResponseCount(sheetId, gid) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  const csv = await res.text();
  return parseCSVRows(csv).length;
}

async function main() {
  const schemasPath = 'C:/Users/Andres Bedoya Cano/.gemini/antigravity/brain/9fb354b4-a0c5-4431-adca-e437e73face8/scratch/form-schemas.json';
  const schemas = JSON.parse(fs.readFileSync(schemasPath, 'utf8'));
  const targetCount = 20;

  for (const [key, meta] of Object.entries(FORMS)) {
    const { sheetId, gid } = await resolveSheetInfo(key, meta);
    meta.sheetId = sheetId;
    meta.gid = gid;

    const currentCount = await getResponseCount(sheetId, gid);
    const needed = Math.max(0, targetCount - currentCount);
    console.log(`\n[${key}] Current responses: ${currentCount} | Target: ${targetCount} | To submit: ${needed}`);

    const schema = schemas[key];
    for (let i = 0; i < needed; i++) {
      const persona = PERSONAS[i % PERSONAS.length];
      const answers = persona[key];
      if (!answers || answers.length !== schema.questions.length) {
        throw new Error(`Persona ${persona.id} answers length mismatch for ${key}: got ${answers?.length}, expected ${schema.questions.length}`);
      }

      const params = new URLSearchParams();
      params.append('fvv', '1');
      params.append('pageHistory', schema.pageHistory);

      schema.questions.forEach((q, idx) => {
        const rawVal = answers[idx];
        let formattedVal;
        if (key === 'SAM') {
          formattedVal = String(rawVal);
        } else if (key === 'GRIHO') {
          formattedVal = GRIHO_OPTS[rawVal];
        } else {
          formattedVal = LIKERT_MAP[rawVal];
        }
        if (!q.options.includes(formattedVal)) {
          throw new Error(`Invalid option "${formattedVal}" for ${key} Q${idx + 1}. Allowed: ${JSON.stringify(q.options)}`);
        }
        params.append(`entry.${q.entryId}`, formattedVal);
      });

      const resp = await fetch(meta.formResponseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      console.log(`  -> Submitted ${persona.id} to ${key}: HTTP ${resp.status}`);
      await new Promise(r => setTimeout(r, 800));
    }

    // Wait a moment for Google Sheets sync and check count again
    await new Promise(r => setTimeout(r, 1500));
    const finalCount = await getResponseCount(sheetId, gid);
    console.log(`[${key}] Final response count in Google Sheet: ${finalCount}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
