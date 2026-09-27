import { appIdentity } from '@/lib/config/app-identity'
export async function GET(){
  const address=appIdentity.contacts.security
  if(!address)return new Response('Not configured',{status:404,headers:{'Cache-Control':'no-store'}})
  const body=[`Contact: mailto:${address}`,'Preferred-Languages: de, en, fr, it, tr',`Canonical: ${new URL('/.well-known/security.txt',appIdentity.website)}`,`Policy: ${new URL('/security',appIdentity.website)}`,''].join('\n')
  return new Response(body,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=3600'}})
}
