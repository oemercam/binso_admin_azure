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
  "/operator/support",
  "/operator/sicherheit",
  "/operator/audit",
  "/preview/dashboard",
  "/preview/rechnungen",
  "/preview/zeit",
];

const seenAssets=new Set();
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
    try{
      asset=await fetch(assetUrl,{headers:{"cache-control":"no-cache"}});
    }catch(error){
      failures.push(`${route}: stylesheet request failed ${assetUrl} (${error instanceof Error?error.message:String(error)})`);
      continue;
    }

    const type=asset.headers.get("content-type")||"";
    if(!asset.ok){
      failures.push(`${route}: stylesheet HTTP ${asset.status} ${assetUrl}`);
      continue;
    }
    if(!type.includes("text/css")){
      failures.push(`${route}: stylesheet has wrong content-type "${type}" ${assetUrl}`);
      continue;
    }

    const css=await asset.text();
    if(css.length<100){
      failures.push(`${route}: stylesheet unexpectedly small (${css.length} bytes) ${assetUrl}`);
    }
  }
}

if(failures.length){
  console.error("Route/CSS integrity check failed:");
  for(const failure of failures) console.error("- "+failure);
  process.exit(1);
}

console.log(`Route/CSS integrity OK: ${routes.length} routes, ${seenAssets.size} unique stylesheets.`);
