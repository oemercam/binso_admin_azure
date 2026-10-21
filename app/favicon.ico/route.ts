/** Preserve legacy browser favicon requests without a duplicate brand asset. */
export function GET(request:Request){return Response.redirect(new URL('/brand/pwa-icon-192.png',request.url),308);}
