import 'server-only'


function deliveryMode() {
  return process.env.EMAIL_DELIVERY_MODE?.trim().toLowerCase() === 'graph' ? 'graph' : 'disabled'
}

function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} ist für Microsoft Graph Mailversand erforderlich.`)
  return value
}

async function graphAccessToken() {
  const tenantId = required('GRAPH_TENANT_ID')
  const clientId = required('GRAPH_CLIENT_ID')
  const clientSecret = required('GRAPH_CLIENT_SECRET')
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  })
  const response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`, {
    signal: AbortSignal.timeout(15_000),
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body, cache: 'no-store',
  })
  const payload = await response.json().catch(() => ({})) as { access_token?: string; error_description?: string }
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || 'Microsoft Graph Token konnte nicht erstellt werden.')
  return payload.access_token
}

export function graphMailConfigured() {
  if (deliveryMode() !== 'graph') return false
  return ['GRAPH_TENANT_ID','GRAPH_CLIENT_ID','GRAPH_CLIENT_SECRET','GRAPH_SENDER_USER_ID'].every((name) => Boolean(process.env[name]?.trim()))
}

export async function sendGraphMail(input: { to: string; subject: string; text: string; htmlAttachment?: string }) {
  if (!graphMailConfigured()) throw new Error('Microsoft Graph Mail ist nicht konfiguriert.')
  const token = await graphAccessToken()
  const sender = required('GRAPH_SENDER_USER_ID')
  const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`, {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    signal: AbortSignal.timeout(20_000), cache: 'no-store',
    body: JSON.stringify({ message: { subject: input.subject, body: { contentType: 'Text', content: input.text },
      toRecipients: [{ emailAddress: { address: input.to } }],
      ...(input.htmlAttachment ? { attachments: [{ '@odata.type': '#microsoft.graph.fileAttachment', name: 'Dokument.html', contentType: 'text/html', contentBytes: Buffer.from(input.htmlAttachment).toString('base64') }] } : {}) }, saveToSentItems: true }),
  })
  if (response.status !== 202) throw new Error(`Graph Mail-Annahme fehlgeschlagen (${response.status}).`)
  return { accepted: true, requestId: response.headers.get('request-id') }
}
