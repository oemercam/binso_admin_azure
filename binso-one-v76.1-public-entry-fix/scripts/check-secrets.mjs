import fs from 'node:fs'
import path from 'node:path'

const skipDirs = new Set(['.git','.next','node_modules','deploy-root'])
const allowedFiles = new Set(['.env.example','pnpm-lock.yaml'])
const suspiciousAssignments = /(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*['\"]([^'\"\s]{16,})['\"]/ig
const privateKey = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
const connectionString = /postgres(?:ql)?:\/\/([^\s:@]+):([^\s@]+)@([^\s/:]+)/ig
const failures=[]

function inspect(file, text) {
  if (privateKey.test(text)) failures.push(file)
  suspiciousAssignments.lastIndex = 0
  for (const match of text.matchAll(suspiciousAssignments)) {
    const value = match[1]
    if (value.includes('${{') || value.includes('example') || value.includes('placeholder')) continue
    failures.push(file)
  }
  connectionString.lastIndex = 0
  for (const match of text.matchAll(connectionString)) {
    const host = match[3].toLowerCase()
    const password = match[2]
    if (['127.0.0.1','localhost'].includes(host) && ['local-test-only','postgres'].includes(password)) continue
    failures.push(file)
  }
}

function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(skipDirs.has(ent.name)) continue
    const full=path.join(dir,ent.name)
    if(ent.isDirectory()) { walk(full); continue }
    if(allowedFiles.has(ent.name) || /scripts[\\/]check-.*\.mjs$/.test(full)) continue
    if(!/\.(?:ts|tsx|js|mjs|json|md|yml|yaml|sql|txt|env)$/i.test(ent.name)) continue
    inspect(full, fs.readFileSync(full,'utf8'))
  }
}
walk('.')
if(failures.length){ console.error('Potential committed secrets found:'); [...new Set(failures)].forEach(f=>console.error(`- ${f}`)); process.exit(1) }
console.log('Secret hygiene check passed.')
