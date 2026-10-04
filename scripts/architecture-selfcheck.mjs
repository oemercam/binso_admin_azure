import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const backend=await fs.readFile('lib/client/backend.ts','utf8');
assert.ok(!backend.includes('NEXT_PUBLIC_SUPABASE'),'Backend mode must use Azure API, not retired Supabase configuration');
for(const script of Object.values(JSON.parse(await fs.readFile('package.json','utf8')).scripts)){
 for(const match of script.matchAll(/node (scripts\/[\w.-]+\.mjs)/g))await fs.access(match[1]);
}
console.log('Architecture entry points and package scripts passed.');
