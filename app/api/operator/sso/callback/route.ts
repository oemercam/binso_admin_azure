import {NextRequest,NextResponse} from "next/server";
import {getEntraOperatorIdentity} from "@/lib/server/operator/entra";
import {createOperatorSession} from "@/lib/server/operator/session";
import {query,withTransaction} from "@/lib/server/db";
import {platformAudit} from "@/lib/server/operator/audit";

export const runtime="nodejs";

export async function GET(request:NextRequest){
  const identity=await getEntraOperatorIdentity();
  if(!identity)return NextResponse.redirect(new URL("/operator/login?error=entra_access_denied",request.url));

  const fallbackUserId=`entra:${identity.tenantId}:${identity.objectId}`;
  const userId=await withTransaction(async client=>{
    const existing=await client.query<{user_id:string}>(
      "select user_id from platform_operator_assignments where lower(email)=lower($1) or (entra_tenant_id=$2 and entra_object_id=$3) order by created_at asc limit 1 for update",
      [identity.email,identity.tenantId,identity.objectId]
    );
    const id=existing.rows[0]?.user_id??fallbackUserId;
    await client.query(
      `insert into platform_operator_assignments(
         user_id,email,role,status,display_name,entra_object_id,entra_tenant_id,auth_source,last_login_at,last_entra_sync_at,updated_at
       ) values($1,$2,$3,'active',$4,$5,$6,'entra',now(),now(),now())
       on conflict(user_id) do update set
         email=excluded.email,role=excluded.role,status='active',display_name=excluded.display_name,
         entra_object_id=excluded.entra_object_id,entra_tenant_id=excluded.entra_tenant_id,
         auth_source='entra',last_login_at=now(),last_entra_sync_at=now(),password_hash=null,updated_at=now()`,
      [id,identity.email,identity.role,identity.name,identity.objectId,identity.tenantId]
    );
    await client.query("delete from platform_auth_sessions where user_id=$1",[id]);
    return id;
  });

  await createOperatorSession({userId,email:identity.email,name:identity.name,role:identity.role});
  await platformAudit({userId,userEmail:identity.email,action:"operator.entra_login",entityType:"platform_operator",entityId:userId,metadata:{role:identity.role,appRole:identity.appRole}});

  const next=request.nextUrl.searchParams.get("next");
  return NextResponse.redirect(new URL(next?.startsWith("/operator")?next:"/operator",request.url));
}
