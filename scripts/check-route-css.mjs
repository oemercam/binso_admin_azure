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
  const requiredCssMarkers=["--font-sans",".marketing-header",".button",".hero",".app-root","@media"];
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
  const response=await fetch(origin+"/api/demo/session",{
    method:"POST",
    redirect:"manual",
    headers:{
      "content-type":"application/json",
      "origin":origin,
      "referer":origin+"/demo",
      "user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
    },
    body:"{}",
  });
  const cookie=response.headers.get("set-cookie")||"";
  if(!response.ok) failures.push(`/api/demo/session: POST returned ${response.status}`);
  if(!cookie.includes("binso_demo=1")) failures.push("/api/demo/session: demo cookie was not issued");
  if(response.ok&&cookie.includes("binso_demo=1")){
    const dashboard=await fetch(origin+"/dashboard",{
      redirect:"manual",
      headers:{cookie:"binso_demo=1","cache-control":"no-cache"},
    });
    if(dashboard.status>=300&&dashboard.status<400){
      failures.push(`/dashboard: demo cookie was rejected with redirect ${dashboard.status}`);
    }else if(!dashboard.ok){
      failures.push(`/dashboard: demo session returned ${dashboard.status}`);
    }
  }
}
await verifyDemoFlow();

if(failures.length){
  console.error("Demo flow integrity check failed:");
  for(const failure of failures) console.error("- "+failure);
  process.exit(1);
}
console.log("Demo flow integrity OK.");

await import("./check-theme.mjs");
