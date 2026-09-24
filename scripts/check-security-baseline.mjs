import fs from 'node:fs'
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'))
const ts=JSON.parse(fs.readFileSync('tsconfig.json','utf8'))
const config=fs.readFileSync('next.config.ts','utf8')
const failures=[]
if (!String(pkg.engines?.node||'').includes('24')) failures.push('Node 24 engine missing')
if (pkg.packageManager !== 'pnpm@10.17.1') failures.push('pnpm version is not pinned')
if (ts.compilerOptions?.strict !== true) failures.push('TypeScript strict mode disabled')
for (const name of ['lint','typecheck','test','test:unit','test:integration','test:e2e','build']) if (!pkg.scripts?.[name]) failures.push(`Missing script ${name}`)
for (const header of ['Strict-Transport-Security','Content-Security-Policy','X-Content-Type-Options','Referrer-Policy','Permissions-Policy','X-Frame-Options']) if (!config.includes(header)) failures.push(`Missing security header ${header}`)
if (failures.length) { console.error(`Security baseline failed (${failures.length}):`); failures.forEach(f=>console.error(`- ${f}`)); process.exit(1) }
console.log('Security baseline checks passed.')
