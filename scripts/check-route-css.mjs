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
      continue;
    }
    const requiredCssMarkers=["--font-sans",".marketing-header",".button",".hero",".app-root","@media"];
    const markerMatches=requiredCssMarkers.filter(marker=>css.includes(marker));
    if(markerMatches.length<3){
      failures.push(`${route}: stylesheet is missing Binso UI rules (found ${markerMatches.join(", ")||"none"}) ${assetUrl}`);
    }
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
    const dashboard=await fetch(origin+"/willkommen",{
      redirect:"manual",
      headers:{cookie:"binso_demo=1","cache-control":"no-cache"},
    });
    if(dashboard.status>=300&&dashboard.status<400){
      failures.push(`/willkommen: demo cookie was rejected with redirect ${dashboard.status}`);
    }else if(!dashboard.ok){
      failures.push(`/willkommen: demo session returned ${dashboard.status}`);
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


async function verifyPublicLaunch(){
  const home=await fetch(base+"/",{redirect:"manual",headers:{"cache-control":"no-cache"}});
  if(!home.ok) failures.push(`/: public landing page returned ${home.status}`);
  else{
    const html=await home.text();
    if(!/property=["']og:image["']/i.test(html)) failures.push("/: Open Graph image metadata missing");
    if(!/name=["']twitter:card["']/i.test(html)) failures.push("/: Twitter card metadata missing");
    if(!/rel=["']canonical["']/i.test(html)) failures.push("/: canonical metadata missing");
  }
  const demo=await fetch(base+"/demo",{redirect:"manual",headers:{"cache-control":"no-cache"}});
  if(!demo.ok) failures.push(`/demo: anonymous visitor received ${demo.status}`);
  const social=await fetch(base+"/opengraph-image",{redirect:"manual"});
  if(!social.ok) failures.push(`/opengraph-image: returned ${social.status}`);
  else if(!(social.headers.get("content-type")||"").includes("image/")) failures.push("/opengraph-image: invalid content type");
}
await verifyPublicLaunch();

if(failures.length){
  console.error("Public launch integrity check failed:");
  for(const failure of failures) console.error("- "+failure);
  process.exit(1);
}
console.log("Public landing, social metadata and anonymous demo access OK.");
