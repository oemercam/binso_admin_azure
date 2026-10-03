import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes=[
  "/dashboard","/kunden","/angebote","/rechnungen","/zahlungen","/produkte",
  "/mitarbeiter","/spesen","/zeit","/support","/einstellungen","/belege",
  "/benachrichtigungen","/willkommen"
];

export function proxy(request:NextRequest){
  if(!process.env.DATABASE_URL) return NextResponse.next();

  const pathname=request.nextUrl.pathname;
  const isProtected=protectedPrefixes.some(prefix=>pathname===prefix||pathname.startsWith(prefix+"/"));
  if(!isProtected) return NextResponse.next();

  const demo=request.cookies.get("binso_demo")?.value==="1";
  const access=request.cookies.get("binso_access_token")?.value;
  const refresh=request.cookies.get("binso_refresh_token")?.value;
  if(demo||access||refresh) return NextResponse.next();

  const login=new URL("/login",request.url);
  login.searchParams.set("next",pathname);
  return NextResponse.redirect(login);
}

export const config={
  matcher:[
    "/dashboard/:path*","/kunden/:path*","/angebote/:path*","/rechnungen/:path*",
    "/zahlungen/:path*","/produkte/:path*","/mitarbeiter/:path*","/spesen/:path*",
    "/zeit/:path*","/support/:path*","/einstellungen/:path*","/belege/:path*",
    "/benachrichtigungen/:path*","/willkommen/:path*"
  ]
};
