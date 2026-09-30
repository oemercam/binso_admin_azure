const VERSION="v8";
const STATIC_CACHE=`binso-static-${VERSION}`;
const PUBLIC_CACHE=`binso-public-${VERSION}`;
const APP_SHELL=["/offline","/icons/icon-192.png","/icons/icon-512.png","/brand/binso-icon-black.svg","/brand/binso-icon-white.svg"];

self.addEventListener("install",event=>{event.waitUntil(caches.open(STATIC_CACHE).then(cache=>cache.addAll(APP_SHELL)))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>!key.endsWith(VERSION)).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener("message",event=>{if(event.data?.type==="SKIP_WAITING")self.skipWaiting()});

function isSensitive(url){return url.pathname.startsWith("/api/")||url.pathname.startsWith("/dashboard")||url.pathname.startsWith("/kunden")||url.pathname.startsWith("/projekte")||url.pathname.startsWith("/rechnungen")||url.pathname.startsWith("/operator")||url.pathname.startsWith("/portal")}
function isStatic(request,url){return url.pathname.startsWith("/_next/static/")||url.pathname.startsWith("/icons/")||url.pathname.startsWith("/brand/")||["style","script","font","image"].includes(request.destination)}
self.addEventListener("fetch",event=>{
 const request=event.request;if(request.method!=="GET")return;
 const url=new URL(request.url);if(url.origin!==self.location.origin)return;
 if(isSensitive(url)){
  if(request.mode==="navigate")event.respondWith(fetch(request).catch(()=>caches.match("/offline")));
  return;
 }
 if(isStatic(request,url)){
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(STATIC_CACHE).then(cache=>cache.put(request,copy))}return response})));
  return;
 }
 if(request.mode==="navigate"){
  event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(PUBLIC_CACHE).then(cache=>cache.put(request,copy))}return response}).catch(()=>caches.match(request).then(cached=>cached||caches.match("/offline"))));
 }
});
