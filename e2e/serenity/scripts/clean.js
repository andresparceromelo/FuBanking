// Borra el reporte anterior para que cada corrida empiece limpia.
const { rmSync } = require('node:fs');
const { join } = require('node:path');

rmSync(join(__dirname, '..', 'reports'), { recursive: true, force: true });
