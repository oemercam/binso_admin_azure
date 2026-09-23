import 'server-only'

type EmailDeliveryResult = { delivered: boolean; provider: 'graph' | 'disabled'; messageId?: string }

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

export async function sendOrganizationInvitation(input: {
  to: string
  organizationName: string
  inviter: string
  roleLabel: string
  signInUrl: string
}): Promise<EmailDeliveryResult> {
  if (deliveryMode() !== 'graph') return { delivered: false, provider: 'disabled' }

  const sender = required('GRAPH_SENDER_USER_ID')
  const token = await graphAccessToken()
  const subject = `Einladung zu ${input.organizationName} in Binso One`
  const text = [
    `Du wurdest von ${input.inviter} zu ${input.organizationName} in Binso One eingeladen.`,
    `Rolle: ${input.roleLabel}`,
    '',
    'Melde dich mit genau dieser E-Mail-Adresse an, damit die Einladung deinem Konto zugeordnet werden kann:',
    input.signInUrl,
    '',
    'Binso One wird von Binso GmbH entwickelt und betrieben.',
  ].join('\n')

  const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'Text', content: text },
        toRecipients: [{ emailAddress: { address: input.to } }],
      },
      saveToSentItems: true,
    }),
    cache: 'no-store',
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(payload.error?.message || `Microsoft Graph Mailversand fehlgeschlagen (${response.status}).`)
  }
  return { delivered: true, provider: 'graph', messageId: response.headers.get('request-id') ?? undefined }
}
