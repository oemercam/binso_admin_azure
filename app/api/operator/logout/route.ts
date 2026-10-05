import {NextResponse} from "next/server";
import {destroyOperatorSession} from "@/lib/server/operator/session";
import {microsoftLogoutUrl} from "@/lib/server/operator/entra";

export const runtime="nodejs";

export async function POST(){
  await destroyOperatorSession();
  return NextResponse.json({ok:true,microsoftLogoutUrl:microsoftLogoutUrl()});
}
