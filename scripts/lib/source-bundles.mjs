import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export function readAppUiCss(root = process.cwd()) {
  const directory = join(root, 'app/styles/app-ui')
  return readdirSync(directory)
    .filter((name) => name.endsWith('.css'))
    .sort()
    .map((name) => readFileSync(join(directory, name), 'utf8'))
    .join('\n')
}

export function readBusinessStoreBundle(root = process.cwd()) {
  const files = [
    'components/state/business-store.tsx',
    'components/state/business-store-types.ts',
    'components/state/business-store-state.ts',
    'components/state/business-store-utils.ts',
  ]
  return files.map((file) => readFileSync(join(root, file), 'utf8')).join('\n')
}
