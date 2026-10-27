import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface StagehandStepEvidence {
  step: string;
  capability: 'act' | 'observe' | 'extract';
  instruction: string;
  result: any;
  durationMs: number;
}

export class EvidenceManager {
  private evidenceDir: string;
  private steps: StagehandStepEvidence[] = [];

  constructor() {
    const cwd = process.cwd();
    this.evidenceDir = cwd.endsWith('stagehand')
      ? join(cwd, 'evidence')
      : join(cwd, 'e2e/stagehand/evidence');
  }

  async init() {
    await mkdir(this.evidenceDir, { recursive: true });
  }

  recordStep(evidence: StagehandStepEvidence) {
    this.steps.push(evidence);
    console.log(
      `\x1b[32m✓ [${evidence.capability.toUpperCase()}]\x1b[0m ${evidence.step} (\x1b[33m${evidence.durationMs}ms\x1b[0m)`
    );
  }

  async saveScreenshot(page: any, filename: string): Promise<string> {
    await this.init();
    const filepath = join(this.evidenceDir, filename);
    if (page && typeof page.screenshot === 'function') {
      await page.screenshot({ path: filepath, fullPage: true });
      console.log(`  📸 Captura de evidencia guardada: \x1b[36m${filename}\x1b[0m`);
    }
    return filepath;
  }

  async exportReport(scenarioName: string): Promise<string> {
    await this.init();
    const filename = `${scenarioName.toLowerCase().replace(/\s+/g, '-')}-report.json`;
    const filepath = join(this.evidenceDir, filename);

    const reportData = {
      scenario: scenarioName,
      executedAt: new Date().toISOString(),
      totalSteps: this.steps.length,
      steps: this.steps,
    };

    await writeFile(filepath, JSON.stringify(reportData, null, 2), 'utf8');
    return filepath;
  }
}
