/**
 * Script de exportación y consolidación estadística de las 5 encuestas UX (N = 15)
 * desde las hojas de cálculo oficiales vinculadas en Google Sheets.
 */

import fs from 'node:fs';
import path from 'node:path';

const EDIT_URLS = {
  QUIM: 'https://docs.google.com/forms/d/1R_oeWHpG35CZi_oEgO0su_XSfprsJQcECCcOrdusdD8/edit',
  SAM: 'https://docs.google.com/forms/d/1HigVK7n8BvdwSsD7X6zQ8QnhyjmNYfAWNDnFboN3zhk/edit',
  SUMI: 'https://docs.google.com/forms/d/1_VcjTG2FZScugf534_kd3gfbrcDPtmYHijLxxvEqwy4/edit',
  UES: 'https://docs.google.com/forms/d/1jXPWkJGiRsopeITUATk5VrXt527s6J4RLhYmNvKpsWM/edit',
  GRIHO: 'https://docs.google.com/forms/d/1saU6BYhcFnEqk7m91jmbUOllQ-sbw9peXPvwZ_6cGtM/edit',
};

function parseCSV(text) {
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
  return rows;
}

function calcStats(nums) {
  const n = nums.length || 1;
  const mean = nums.reduce((a, b) => a + b, 0) / n;
  const variance = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  return {
    mean: Number(mean.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    min: Math.min(...nums),
    max: Math.max(...nums),
  };
}

async function main() {
  const outDir = 'C:/Users/Andres Bedoya Cano/.gemini/antigravity/brain/9fb354b4-a0c5-4431-adca-e437e73face8/scratch/csv_final_15';
  fs.mkdirSync(outDir, { recursive: true });

  const summary = {};

  for (const [key, editUrl] of Object.entries(EDIT_URLS)) {
    const html = await (await fetch(editUrl)).text();
    const m = html.match(/\["([a-zA-Z0-9_-]{30,})",\s*3,\s*\["(\d+)"\]\]/);
    if (!m) throw new Error(`Missing sheet for ${key}`);
    const sheetId = m[1];
    const gid = m[2];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    const csv = await (await fetch(csvUrl)).text();
    fs.writeFileSync(path.join(outDir, `${key}.csv`), csv, 'utf8');

    const rows = parseCSV(csv);
    const headers = rows[0];
    const dataRows = rows.slice(1).filter(r => r.length > 1 && r[0].trim() !== '');
    console.log(`${key}: ${dataRows.length} rows exported (sheetId=${sheetId}, gid=${gid})`);

    const questions = [];
    for (let q = 1; q < headers.length; q++) {
      const title = headers[q].replace(/\s+/g, ' ').trim();
      if (key !== 'GRIHO') {
        const vals = dataRows.map(r => {
          const match = String(r[q] || '').match(/^(\d+)/);
          return match ? Number(match[1]) : NaN;
        }).filter(v => !isNaN(v));
        questions.push({
          qIndex: q,
          title,
          ...calcStats(vals),
          values: vals,
        });
      } else {
        const counts = {
          YES: 0,
          PARTIAL: 0,
          NOT_ALWAYS: 0,
          NO: 0,
          NA: 0,
          NO_PROBLEM: 0,
        };
        dataRows.forEach(r => {
          const v = String(r[q] || '');
          if (v.startsWith('SÍ,')) counts.YES++;
          else if (v.startsWith('Sí, pero')) counts.PARTIAL++;
          else if (v.startsWith('No siempre')) counts.NOT_ALWAYS++;
          else if (v.startsWith('NO, en NINGÚN')) counts.NO++;
          else if (v.startsWith('No aplica')) counts.NA++;
          else if (v.startsWith('NO es un problema')) counts.NO_PROBLEM++;
        });
        questions.push({
          qIndex: q,
          title,
          counts,
        });
      }
    }

    summary[key] = {
      key,
      sheetId,
      gid,
      csvUrl,
      respondentCount: dataRows.length,
      timestamps: dataRows.map(r => r[0]),
      questions,
    };
  }

  fs.writeFileSync(
    path.join(outDir, 'consolidated-summary.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  );
  console.log('Saved consolidated-summary.json!');
}

main().catch(console.error);
