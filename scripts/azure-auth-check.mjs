import fs from 'node:fs';
const config=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const properties=config.properties;
const provider=properties?.identityProviders?.azureActiveDirectory;
const expectedTenant=process.env.AUDIT_ENTRA_TENANT_ID?.trim().toLowerCase();
const issuer=provider?.registration?.openIdIssuer;
let issuerTenant='';
try {
 const url=new URL(issuer);
 if(url.protocol==='https:'&&url.hostname==='login.microsoftonline.com')issuerTenant=url.pathname.split('/')[1]?.toLowerCase()??'';
} catch {}
const valid=expectedTenant&&properties?.platform?.enabled===true&&provider?.enabled===true
 && typeof provider.registration?.clientId==='string'&&provider.registration.clientId.trim()
 && issuerTenant===expectedTenant;
if(!valid){console.error('::error::Easy Auth/AAD enablement, client registration or pinned tenant issuer is missing/invalid.');process.exit(1);}
console.log('Easy Auth configuration verified; ingress header trust and role assignments require separate evidence.');
