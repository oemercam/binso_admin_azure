import { requireOperatorSession as requireRbacOperatorSession } from "@/lib/server/operator/session";
import { authorizeOperator } from "@/lib/server/operator/rbac";
import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, json } from "@/lib/server/http";
import { requireOperatorSession } from "@/lib/server/operator";
import { sendMail } from "@/lib/server/email";

export async function POST(request:NextRequest){
  try{const rbacSession=await requireRbacOperatorSession();authorizeOperator(rbacSession,"integrations:test");
    assertSameOrigin(request);
    const session=await requireOperatorSession();
    const email=session.email;
    if(!email) return json({error:"email_missing",message:"Operator-Konto hat keine E-Mail-Adresse."},400);
    const result=await sendMail({
      to:email,
      subject:"Binso One – E-Mail Integrationstest",
      html:"<p>Der produktive E-Mail-Versand von Binso One ist erfolgreich verbunden.</p><p>Diese Nachricht wurde bewusst durch einen autorisierten Operator ausgelöst.</p>",
      text:"Der produktive E-Mail-Versand von Binso One ist erfolgreich verbunden.",
    });
    return json({ok:true,delivered:result.delivered,provider:result.provider});
  }catch(error){return apiError(error);}
}
