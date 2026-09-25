import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const plans = readFileSync(new URL('../lib/data/plans.ts', import.meta.url), 'utf8')
assert.match(plans, /id: 'starter'[\s\S]*features: \['crm','quotes','orders','invoices','exports'\]/)
assert.match(plans, /id: 'business'[\s\S]*'time'[\s\S]*'employees'/)
assert.match(plans, /id: 'professional'[\s\S]*'audit'[\s\S]*'api'[\s\S]*'automations'/)
assert.match(plans, /id: 'enterprise'[\s\S]*selfService: false/)

const permissions = readFileSync(new URL('../lib/auth/permissions.ts', import.meta.url), 'utf8')
assert.match(permissions, /employee:[\s\S]*'time\.write'/)
assert.doesNotMatch(permissions, /employee:[\s\S]*'billing\.manage'/)
console.log('V72 unit foundation passed.')
