import siteManifest from "@/lib/site-manifest";

export function GET(){return Response.json(siteManifest(),{headers:{"Content-Type":"application/manifest+json","Cache-Control":"public, max-age=0, must-revalidate"}});}
