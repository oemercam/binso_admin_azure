import { spawn } from 'node:child_process'
import { resolve, join, basename } from 'node:path'
import { cpSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'

const source = resolve(process.argv[2] || '.next/standalone')
const root = mkdtempSync(join(tmpdir(), 'binso-v69-smoke-'))

cpSync(source, root, {
  recursive: true,
  dereference: true,
  filter: path => !basename(path).startsWith('.env'),
})

const runtimeRequire = createRequire(join(root, 'server.js'))
const reactDomRequire = createRequire(runtimeRequire.resolve('react-dom/package.json'))

assert.equal(
  runtimeRequire.resolve('react'),
  reactDomRequire.resolve('react'),
  'React and ReactDOM must share one React instance',
)

const port = 3187

const child = spawn(process.execPath, ['server.js'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(port),
    HOSTNAME: '127.0.0.1',
    DATABASE_URL: '',
    AUTH_MODE: 'azure',
    NEXT_TELEMETRY_DISABLED: '1',
  },
})

let log = ''

child.stdout.on('data', data => {
  log += data.toString()
})

child.stderr.on('data', data => {
  log += data.toString()
})

try {
  let ready = false

  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) {
      throw new Error(`Standalone exited: ${log}`)
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/health`,
        { signal: AbortSignal.timeout(1000) },
      )

      if (response.status === 503) {
        ready = true
        break
      }
    } catch {
      // startup
    }

    await new Promise(resolve => setTimeout(resolve, 500))
  }

  assert.ok(ready, `Standalone did not become ready: ${log}`)

  for (const path of [
    '/offline',
    '/manifest.webmanifest',
    '/sw.js',
    '/icons/app-192.png',
  ]) {
    const response = await fetch(
      `http://127.0.0.1:${port}${path}`,
      { signal: AbortSignal.timeout(5000) },
    )

    assert.equal(response.status, 200, path)
  }

  const signInPage = await fetch(
    `http://127.0.0.1:${port}/sign-in`,
    {
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    },
  )

  assert.ok(
    [307, 308].includes(signInPage.status),
    `/sign-in must redirect, received ${signInPage.status}`,
  )

  const signInLocation = signInPage.headers.get('location') ?? ''

  assert.ok(
    signInLocation.includes('/api/auth/login?returnTo='),
    `/sign-in must redirect through the canonical login route, received ${signInLocation}`,
  )

  const loginRoute = await fetch(
    `http://127.0.0.1:${port}/api/auth/login?returnTo=%2Fpost-login`,
    {
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    },
  )

  assert.ok(
    [307, 308].includes(loginRoute.status),
    `Azure login route must redirect, received ${loginRoute.status}`,
  )

  const loginLocation = loginRoute.headers.get('location') ?? ''

  assert.match(
    loginLocation,
    /\/\.auth\/login\/[^?]+/,
    `Azure login route must target Easy Auth, received ${loginLocation}`,
  )

  const protectedPage = await fetch(
    `http://127.0.0.1:${port}/dashboard`,
    { redirect: 'manual' },
  )

  assert.ok(
    [307, 308].includes(protectedPage.status),
    'Unauthenticated dashboard must redirect',
  )

  console.log('Isolated standalone HTTP smoke test passed.')
} finally {
  child.kill()

  if (child.exitCode === null && child.signalCode === null) {
    await new Promise(resolve => child.once('exit', resolve))
  }

  if (
    resolve(root).startsWith(resolve(tmpdir())) &&
    basename(root).startsWith('binso-v69-smoke-')
  ) {
    rmSync(root, { recursive: true, force: true })
  }
}