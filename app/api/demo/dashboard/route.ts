import {json} from "@/lib/server/http";

/** Retired URL: never authenticates, provisions data or grants demo access. */
const retired=()=>json({error:"demo_retired",message:"Der Demo-Zugang wurde entfernt."},410);
export const GET=retired;
export const POST=retired;
export const DELETE=retired;