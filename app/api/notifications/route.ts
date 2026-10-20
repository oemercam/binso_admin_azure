import {NextRequest} from "next/server";
import {requireSession} from "@/lib/server/session";
import {withTenant} from "@/lib/server/db";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject,stringField} from "@/lib/server/validation";
import {notificationList,markNotificationsRead} from '@/lib/server/repositories/notifications';
export const runtime="nodejs";
export async function GET(){try{const s=await requireSession();const items=await withTenant(s.organizationId,s.userId,c=>notificationList(c,s));return json({items,unread:items.filter(x=>!x.readAt).length})}catch(e){return apiError(e)}}
export async function PATCH(request:NextRequest){try{assertSameOrigin(request);const s=await requireSession();const b=asObject(await readJson(request,8_000));const id=b.all===true?null:stringField(b,"id",{min:10,max:100});await withTenant(s.organizationId,s.userId,c=>markNotificationsRead(c,s,id));return json({ok:true})}catch(e){return apiError(e)}}
