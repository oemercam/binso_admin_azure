import { json } from "@/lib/server/http";
export async function POST(){return json({error:"legacy_recovery_disabled",message:"Dieser Wiederherstellungsweg wird nicht mehr verwendet."},410);}
