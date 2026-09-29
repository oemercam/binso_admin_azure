import "server-only";
import type { OperatorSession } from "@/lib/server/operator/session";
import { operatorCan, type OperatorPermission } from "@/lib/permissions";
export function authorizeOperator(session:OperatorSession,permission:OperatorPermission){if(!operatorCan(session.role,permission))throw new Response("Forbidden",{status:403})}
