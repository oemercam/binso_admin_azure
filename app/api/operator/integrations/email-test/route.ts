import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, json } from "@/lib/server/http";
import { requireOperatorSession } from "@/lib/server/operator";
import { sendEmail } from "@/lib/server/email";

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const session=await requireOperatorSession();
    const email=session.user.email;
    if(!email) return json({error:"email_missing",message:"Operator-Konto hat keine E-Mail-Adresse."},400);
    const result=await sendEmail({
      to:email,
      subject:"Binso One – E-Mail Integrationstest",
      html:"<p>Der produktive E-Mail-Versand von Binso One ist erfolgreich mit Resend verbunden.</p><p>Diese Nachricht wurde bewusst durch einen autorisierten Operator ausgelöst.</p>",
      text:"Der produktive E-Mail-Versand von Binso One ist erfolgreich mit Resend verbunden.",
    });
    return json({ok:true,id:result.id??null});
  }catch(error){return apiError(error);}
}
