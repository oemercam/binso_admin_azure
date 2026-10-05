import {NextRequest} from "next/server";
import {requireSession} from "@/lib/server/session";
import {query} from "@/lib/server/db";
import {apiError,assertSameOrigin,json} from "@/lib/server/http";

export const runtime="nodejs";

export async function GET(){
  try{
    const session=await requireSession({allowMfaEnrollment:true});
    const result=await query<{
      id:string;
      userAgent:string|null;
      lastSeenAt:string|null;
      expiresAt:string;
    }>(
      `select id,
              user_agent as "userAgent",
              last_seen_at as "lastSeenAt",
              expires_at as "expiresAt"
         from auth_sessions
        where user_id=$1
          and organization_id=$2
          and expires_at>now()
        order by case when id=$3 then 0 else 1 end,
                 coalesce(last_seen_at,expires_at) desc
        limit 50`,
      [session.userId,session.organizationId,session.sessionId]
    );
    return json({
      items:result.rows.map(row=>({
        ...row,
        current:row.id===session.sessionId
      }))
    });
  }catch(error){
    return apiError(error);
  }
}

export async function DELETE(request:NextRequest){
  try{
    assertSameOrigin(request);
    const session=await requireSession({allowMfaEnrollment:true});
    const result=await query(
      `delete from auth_sessions
        where user_id=$1
          and organization_id=$2
          and id<>$3
          and expires_at>now()`,
      [session.userId,session.organizationId,session.sessionId]
    );
    return json({ok:true,revoked:result.rowCount??0});
  }catch(error){
    return apiError(error);
  }
}
