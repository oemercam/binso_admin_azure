import "server-only";
import type { SessionUser } from "@/lib/server/session";
import { tenantCan, type TenantPermission } from "@/lib/permissions";

export type Permission=TenantPermission;
export function authorize(session:SessionUser,permission:Permission){
  if(session.isDemo&&['billing:write','users:manage','organization:delete'].includes(permission))throw new Response('Demo action unavailable',{status:403});
  if(session.organizationStatus==="read_only" && !permission.endsWith(":read") && !["support:write","feedback:write","billing:write"].includes(permission))throw new Response("Read only",{status:403});
  if(!tenantCan(session.role,permission))throw new Response("Forbidden",{status:403});
}
