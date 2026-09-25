import 'server-only'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { query } from '@/lib/db/client'
import { serverEnv } from '@/lib/config/server-env'

function encryptionKey() {
  const raw = serverEnv.pushSubscriptionEncryptionKey
  if (!raw) throw new Error('PUSH_SUBSCRIPTION_ENCRYPTION_KEY is not configured')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new Error('PUSH_SUBSCRIPTION_ENCRYPTION_KEY must be a base64 encoded 32-byte key')
  return key
}

function endpointHash(endpoint: string) {
  return createHash('sha256').update(endpoint).digest('hex')
}

function encrypt(payload: unknown) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, ciphertext]).toString('base64')
}

export function decryptPushPayload(value: string) {
  const data = Buffer.from(value, 'base64')
  const iv = data.subarray(0, 12)
  const tag = data.subarray(12, 28)
  const ciphertext = data.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv)
  decipher.setAuthTag(tag)
  return JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')) as unknown
}

export async function upsertPushSubscription(userId: string, subscription: { endpoint: string; expirationTime?: number | null; keys: { p256dh: string; auth: string } }) {
  await query(
    `insert into push_subscriptions (user_id, endpoint_hash, encrypted_payload, updated_at)
     values ($1, $2, $3, now())
     on conflict (user_id, endpoint_hash) do update
       set encrypted_payload = excluded.encrypted_payload, updated_at = now()`,
    [userId, endpointHash(subscription.endpoint), encrypt(subscription)],
  )
}

export async function deletePushSubscription(userId: string, endpoint: string) {
  await query(`delete from push_subscriptions where user_id = $1 and endpoint_hash = $2`, [userId, endpointHash(endpoint)])
}
