import {NextRequest} from "next/server";
import {requireSession} from "@/lib/server/session";
import {query} from "@/lib/server/db";
import {ApiError,apiError,assertSameOrigin,json} from "@/lib/server/http";

export const runtime="nodejs";

export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    assertSameOrigin(request);
    const session=await requireSession({allowMfaEnrollment:true});
    const {id}=await params;
    if(!/^[0-9a-f-]{36}$/i.test(id))throw new ApiError(400,"session_invalid","Ungültige Sitzung.");
    if(id===session.sessionId)throw new ApiError(400,"current_session","Die aktuelle Sitzung wird über Abmelden beendet.");

    const result=await query(
      `delete from auth_sessions
        where id=$1
          and user_id=$2
          and organization_id=$3`,
      [id,session.userId,session.organizationId]
    );
    if(!result.rowCount)throw new ApiError(404,"session_not_found","Sitzung wurde nicht gefunden.");
    return json({ok:true});
  }catch(error){
    return apiError(error);
  }
}
