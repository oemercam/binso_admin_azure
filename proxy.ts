import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes=[
  "/dashboard","/kunden","/angebote","/rechnungen","/zahlungen","/produkte",
  "/mitarbeiter","/spesen","/zeit","/support","/einstellungen","/belege",
  "/benachrichtigungen","/willkommen"
];

export function proxy(request:NextRequest){
  const pathname=request.nextUrl.pathname;
  const isProtected=protectedPrefixes.some(prefix=>pathname===prefix||pathname.startsWith(prefix+"/"));
  if(!isProtected) return NextResponse.next();

  const demo=request.cookies.get("binso_demo")?.value==="1";
  const session=request.cookies.get(process.env.SESSION_COOKIE_NAME||"binso_session")?.value;
  if(demo||session) return NextResponse.next();

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
