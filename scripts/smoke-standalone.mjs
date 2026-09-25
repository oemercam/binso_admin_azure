import { spawn } from 'node:child_process'
import { resolve, join, basename } from 'node:path'
import { cpSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'

const source = resolve(process.argv[2] || '.next/standalone')
const root = mkdtempSync(join(tmpdir(), 'binso-v78-smoke-'))

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
    AUTH_PROVIDER_NAME: 'external_id',
    AUTH_ADMIN_PROVIDER_NAME: 'aad',
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
    '/',
    '/sign-in',
    '/register',
    '/admin-access',
    '/offline',
    '/manifest.webmanifest',
    '/sw.js',
    '/icons/app-192.png',
  ]) {
    const response = await fetch(
      `http://127.0.0.1:${port}${path}`,
      {
        redirect: 'manual',
        signal: AbortSignal.timeout(5000),
      },
    )

    assert.equal(
      response.status,
      200,
      `${path} must be reachable, received ${response.status}`,
    )
  }

  const signInPage = await fetch(
    `http://127.0.0.1:${port}/sign-in`,
    {
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    },
  )

  assert.equal(
    signInPage.status,
    200,
    `/sign-in must render the V78 customer login page, received ${signInPage.status}`,
  )

  const signInHtml = await signInPage.text()

  assert.match(
    signInHtml,
    /Zum Kunden-Login/,
    '/sign-in must expose the customer login action',
  )

  assert.match(
    signInHtml,
    /audience=customer/,
    '/sign-in must use the customer authentication audience',
  )

  assert.match(
    signInHtml,
    /\/admin-access/,
    '/sign-in must expose the separate Binso admin access',
  )

  const customerLoginRoute = await fetch(
    `http://127.0.0.1:${port}/api/auth/login?audience=customer&returnTo=%2Fpost-login`,
    {
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    },
  )

  assert.ok(
    [307, 308].includes(customerLoginRoute.status),
    `Customer login route must redirect, received ${customerLoginRoute.status}`,
  )

  const customerLoginLocation =
    customerLoginRoute.headers.get('location') ?? ''

  assert.match(
    customerLoginLocation,
    /\/\.auth\/login\/external_id/,
    `Customer login must target External ID, received ${customerLoginLocation}`,
  )

  const adminPage = await fetch(
    `http://127.0.0.1:${port}/admin-access`,
    {
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    },
  )

  assert.equal(
    adminPage.status,
    200,
    `/admin-access must render, received ${adminPage.status}`,
  )

  const adminHtml = await adminPage.text()

  assert.match(
    adminHtml,
    /Microsoft/,
    '/admin-access must expose the Microsoft admin login',
  )

  assert.match(
    adminHtml,
    /audience=admin/,
    '/admin-access must use the admin authentication audience',
  )

  const adminLoginRoute = await fetch(
    `http://127.0.0.1:${port}/api/auth/login?audience=admin&returnTo=%2Fpost-login`,
    {
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    },
  )

  assert.ok(
    [307, 308].includes(adminLoginRoute.status),
    `Admin login route must redirect, received ${adminLoginRoute.status}`,
  )

  const adminLoginLocation =
    adminLoginRoute.headers.get('location') ?? ''

  assert.match(
    adminLoginLocation,
    /\/\.auth\/login\/aad/,
    `Admin login must target Microsoft Entra ID, received ${adminLoginLocation}`,
  )

  const protectedPage = await fetch(
    `http://127.0.0.1:${port}/dashboard`,
    {
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    },
  )

  assert.ok(
    [307, 308].includes(protectedPage.status),
    `Unauthenticated dashboard must redirect, received ${protectedPage.status}`,
  )

  console.log('Isolated standalone HTTP smoke test passed.')
} finally {
  child.kill()

  if (child.exitCode === null && child.signalCode === null) {
    await new Promise(resolve => child.once('exit', resolve))
  }

  if (
    resolve(root).startsWith(resolve(tmpdir())) &&
    basename(root).startsWith('binso-v78-smoke-')
  ) {
    rmSync(root, { recursive: true, force: true })
  }
}
