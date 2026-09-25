import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync } from 'node:fs'
import { basename, dirname, join, resolve, sep } from 'node:path'
import { createRequire } from 'node:module'

const workspace = process.cwd()
const source = resolve(workspace, '.next/standalone')
const destination = resolve(workspace, process.argv[2] || '.cache/v69-deploy')
if (!destination.startsWith(`${resolve(workspace)}${sep}`) || destination === source || existsSync(destination)) throw new Error('Destination must be a new directory inside the workspace.')
if (!existsSync(join(source, 'server.js'))) throw new Error('Run pnpm build first.')
mkdirSync(destination, { recursive: true })
cpSync(source, destination, { recursive: true, dereference: true, filter: path => basename(path) !== 'node_modules' && !basename(path).startsWith('.env') })
cpSync(join(workspace, '.next/static'), join(destination, '.next/static'), { recursive: true })
cpSync(join(workspace, 'public'), join(destination, 'public'), { recursive: true })

function packageRoot(name, from) {
  const require = createRequire(join(from, 'package.json'))
  try { return dirname(realpathSync(require.resolve(`${name}/package.json`))) }
  catch {
    let root = dirname(realpathSync(require.resolve(name)))
    while (dirname(root) !== root) {
      const file = join(root, 'package.json')
      if (existsSync(file) && JSON.parse(readFileSync(file, 'utf8')).name === name) return root
      root = dirname(root)
    }
    throw new Error(`Cannot locate runtime package ${name}`)
  }
}

let count = 0
const hoisted = new Map()
function materialize(name, from, targetModules, ancestors = new Set()) {
  const root = packageRoot(name, from)
  if (ancestors.has(root)) return // Node resolves this dependency from an ancestor.
  // Share identical package instances (especially React) at the runtime root.
  // Only conflicting versions need a nested node_modules directory.
  if (hoisted.get(name) === root) return
  const modules = hoisted.has(name) ? targetModules : join(destination, 'node_modules')
  if (!hoisted.has(name)) hoisted.set(name, root)
  const target = join(modules, name)
  if (existsSync(target)) return
  cpSync(root, target, { recursive: true, dereference: true, filter: path => basename(path) !== 'node_modules' })
  count++
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const chain = new Set([...ancestors, root])
  const dependencies = { ...manifest.dependencies, ...manifest.optionalDependencies, ...manifest.peerDependencies }
  for (const dependency of Object.keys(dependencies)) {
    try { packageRoot(dependency, root) }
    catch (error) {
      if (manifest.optionalDependencies?.[dependency] || manifest.peerDependenciesMeta?.[dependency]?.optional) continue
      throw error
    }
    materialize(dependency, root, join(target, 'node_modules'), chain)
  }
}
const manifest = JSON.parse(readFileSync(join(workspace, 'package.json'), 'utf8'))
for (const dependency of Object.keys(manifest.dependencies)) materialize(dependency, workspace, join(destination, 'node_modules'))
console.log(`Standalone prepared with ${count} physical runtime packages: ${destination}`)
