import {maintenanceState} from "./lib/server/maintenance";
import {asLocale,localeCookie,locales} from "./lib/locales/config";
import { NextRequest, NextResponse } from "next/server";
import {validOperatorSection} from './lib/operator-pages';

const protectedPrefixes=[
  "/dashboard","/kunden","/angebote","/rechnungen","/zahlungen","/produkte",
  "/mitarbeiter","/spesen","/zeit","/support","/einstellungen","/belege",
  "/benachrichtigungen","/willkommen","/finanzen","/projekte","/berichte"
];

function routeProxy(request:NextRequest,headers:Headers){
  const pathname=request.nextUrl.pathname;
  if(pathname.startsWith('/operator/')&&!['/operator/login','/operator/wallboard'].includes(pathname)&&!validOperatorSection(pathname.slice('/operator/'.length)))return NextResponse.rewrite(new URL('/404',request.url),{status:404,headers:{'Cache-Control':'no-store'},request:{headers}});
  if(process.env.NODE_ENV!=="development"&&(pathname==="/dev"||pathname.startsWith("/dev/")))return NextResponse.rewrite(new URL("/404",request.url),{status:404,headers:{"Cache-Control":"no-store"},request:{headers}});
  const isProtected=protectedPrefixes.some(prefix=>pathname===prefix||pathname.startsWith(prefix+"/"));
  if(!isProtected) return NextResponse.next();

  const session=request.cookies.get(process.env.SESSION_COOKIE_NAME||"binso_session")?.value;
  if(session) return NextResponse.next();

  const login=new URL("/login",request.url);
  login.searchParams.set("next",pathname+request.nextUrl.search);
  return NextResponse.redirect(login);
}

export async function proxy(request:NextRequest){
 const requested=request.nextUrl.searchParams.get('lang');
 const explicit=locales.includes(requested as typeof locales[number]);
 const headers=new Headers(request.headers);
 if(explicit){const locale=asLocale(requested);const parts=(headers.get('cookie')??'').split(';').filter(part=>part.trim()&&!part.trim().startsWith(localeCookie+'='));parts.push(localeCookie+'='+locale);headers.set('cookie',parts.join('; '));}
 const maintained=protectedPrefixes.some(prefix=>request.nextUrl.pathname===prefix||request.nextUrl.pathname.startsWith(prefix+"/"))&&(await maintenanceState()).enabled;
 const result=maintained?NextResponse.rewrite(new URL("/wartung",request.url),{status:503,headers:{"Cache-Control":"private, no-store","Retry-After":"60"},request:{headers}}):routeProxy(request,headers);
 const response=result.headers.get('x-middleware-next')==='1'?NextResponse.next({request:{headers}}):result;
 if(explicit)response.cookies.set(localeCookie,asLocale(requested),{path:'/',maxAge:31536000,sameSite:'lax',secure:request.nextUrl.protocol==='https:'});
 return response;
}

export const config={
  matcher:[
    "/","/angebot","/bericht","/opengraph-image","/produkt","/preise","/login","/registrieren","/portal/:path*","/demo","/agb","/datenschutz","/impressum","/auftragsbearbeitung","/unterauftragsbearbeiter","/email-bestaetigen","/einladung","/passwort-vergessen","/passwort-zuruecksetzen",
    "/operator/:path*","/dev/:path*","/dashboard/:path*","/kunden/:path*","/angebote/:path*","/rechnungen/:path*",
    "/zahlungen/:path*","/produkte/:path*","/mitarbeiter/:path*","/spesen/:path*",
    "/zeit/:path*","/support/:path*","/einstellungen/:path*","/belege/:path*",
    "/berichte/:path*","/projekte/:path*","/benachrichtigungen/:path*","/willkommen/:path*","/finanzen/:path*"
  ]
};
