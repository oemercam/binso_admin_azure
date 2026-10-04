import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const deploy=await fs.readFile('.github/workflows/deploy-azure.yml','utf8');
assert.ok(deploy.indexOf('pnpm db:migrate')<deploy.indexOf('pnpm db:check'),'Migrate before checking latest schema');
assert.ok(deploy.includes('Verify current production build and routes'));
console.log('Release gates passed.');
