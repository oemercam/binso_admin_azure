import process from "node:process";

const base=(process.env.BINSO_BASE_URL||"http://127.0.0.1:3000").replace(/\/$/,"");

const routes=[
  "/",
  "/produkt",
  "/preise",
  "/login",
  "/registrieren",
  "/portal",
  "/portal/login",
  "/portal/registrieren",
  "/passwort-vergessen",
  "/passwort-zuruecksetzen",
  "/demo",
  "/offline",
  "/willkommen",
  "/dashboard",
  "/kunden",
  "/kunden/acme",
  "/kunden/neu",
  "/angebote",
  "/angebote/AN-2026-012",
  "/angebote/neu",
  "/rechnungen",
  "/rechnungen/RE-2026-019",
  "/rechnungen/neu",
  "/zahlungen",
  "/zahlungen/1",
  "/zahlungen/neu",
  "/produkte",
  "/produkte/beratung",
  "/produkte/neu",
  "/mitarbeiter",
  "/mitarbeiter/thomas",
  "/mitarbeiter/neu",
  "/spesen",
  "/spesen/1",
  "/spesen/neu",
  "/support",
  "/support/5832",
  "/support/neu",
  "/belege",
  "/benachrichtigungen",
  "/zeit",
  "/einstellungen",
  "/einstellungen/konto",
  "/einstellungen/firma",
  "/einstellungen/abonnement",
  "/einstellungen/benachrichtigungen",
  "/einstellungen/sprache",
  "/einstellungen/sicherheit",
  "/einstellungen/darstellung",
  "/operator",
  "/operator/kunden",
  "/operator/tickets",
  "/operator/sicherheit",
  "/operator/audit",
  "/preview/dashboard",
  "/preview/rechnungen",
  "/preview/zeit",
];

const seenAssets=new Set();
const assetCss=new Map();
const failures=[];

for(const route of routes){
  const url=base+route;
  let response;
  try{
    response=await fetch(url,{headers:{"cache-control":"no-cache"}});
  }catch(error){
    failures.push(`${route}: request failed (${error instanceof Error?error.message:String(error)})`);
    continue;
  }

  if(!response.ok){
    failures.push(`${route}: HTTP ${response.status}`);
    continue;
  }

  const html=await response.text();
  const cssHrefs=[...html.matchAll(/<link\b[^>]*>/gi)]
    .map(match=>match[0])
    .filter(tag=>/\brel=["'][^"']*stylesheet[^"']*["']/i.test(tag))
    .map(tag=>tag.match(/\bhref=["']([^"']+\.css(?:\?[^"']*)?)["']/i)?.[1])
    .filter(Boolean);

  if(cssHrefs.length===0){
    failures.push(`${route}: no stylesheet link found`);
    continue;
  }

  for(const href of cssHrefs){
    const assetUrl=new URL(href,url).toString();
    if(seenAssets.has(assetUrl)) continue;
    seenAssets.add(assetUrl);

    let asset;
    let assetError;
    for(let attempt=1;attempt<=6;attempt++){
      try{
        const probe=new URL(assetUrl);
        probe.searchParams.set("verify",String(attempt));
        asset=await fetch(probe,{headers:{"cache-control":"no-cache, no-store"}});
        if(asset.ok) break;
        assetError=`HTTP ${asset.status}`;
      }catch(error){
        assetError=error instanceof Error?error.message:String(error);
      }
      if(attempt<6) await new Promise(resolve=>setTimeout(resolve,1500));
    }
    if(!asset?.ok){
      failures.push(`${route}: stylesheet unavailable after retries ${assetUrl} (${assetError||"unknown error"})`);
      continue;
    }

    const type=asset.headers.get("content-type")||"";
    if(!type.includes("text/css")){
      failures.push(`${route}: stylesheet has wrong content-type "${type}" ${assetUrl}`);
      continue;
    }

    const css=await asset.text();
    assetCss.set(assetUrl,css);
  }
  // Next.js can split and deduplicate CSS into an empty auxiliary chunk. The
  // complete set linked by each route must still contain every shared UI marker.
  const combinedCss=cssHrefs.map(href=>assetCss.get(new URL(href,url).toString())??'').join('\n');
  const requiredCssMarkers=["--font-sans",".marketing-header",".button",".reference-hero",".app-root","@media"];
  const missing=requiredCssMarkers.filter(marker=>!combinedCss.includes(marker));
  if(combinedCss.length<1000||missing.length){
    failures.push(`${route}: linked stylesheets are incomplete (${combinedCss.length} bytes; missing ${missing.join(", ")||"none"})`);
  }
}

if(failures.length){
  console.error("Route/CSS integrity check failed:");
  for(const failure of failures) console.error("- "+failure);
  process.exit(1);
}

console.log(`Route/CSS integrity OK: ${routes.length} routes, ${seenAssets.size} unique stylesheets.`);


async function verifyDemoFlow(){
 const origin=new URL(base).origin;
 for(const headers of [{},{'x-binso-smoke-test':'retired-proof'}]){
  const response=await fetch(origin+'/api/demo/session',{method:'POST',redirect:'manual',headers:{'content-type':'application/json',origin,...headers},body:'{}'});
  if(response.status!==410)failures.push('Retired demo POST must return 410');
  if(response.headers.get('set-cookie'))failures.push('Retired demo must never issue cookies');
 }
 const legacy=await fetch(origin+'/demo',{redirect:'manual'});
 if(![307,308].includes(legacy.status)||new URL(legacy.headers.get('location')??'',origin).pathname!=='/registrieren')failures.push('Legacy demo must redirect to registration');
}

await verifyDemoFlow();

if(failures.length){
  console.error("Demo flow integrity check failed:");
  for(const failure of failures) console.error("- "+failure);
  process.exit(1);
}
console.log("Retired demo denial and registration redirect verified.");

await import("./check-theme.mjs");
