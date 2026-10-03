import "server-only";
import type { SessionUser } from "@/lib/server/session";
import { tenantCan, type TenantPermission } from "@/lib/permissions";

export type Permission=TenantPermission;
export function authorize(session:SessionUser,permission:Permission){
  if(!tenantCan(session.role,permission))throw new Response("Forbidden",{status:403});
}
