import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {asObject} from '@/lib/server/validation';
import {projectWorkspace,updateProject} from '@/lib/server/repositories/project-workspace';
export const runtime='nodejs';
export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string}>}){try{const s=await requireSession();authorize(s,'projects:read');const {id}=await params;return json(await withTenant(s.organizationId,s.userId,c=>projectWorkspace(c,s,id),{snapshot:true}));}catch(error){return apiError(error)}}
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{assertSameOrigin(request);const s=await requireSession();authorize(s,'projects:write');const {id}=await params,body=asObject(await readJson(request,32000));return json({item:await withTenant(s.organizationId,s.userId,c=>updateProject(c,s,id,body))});}catch(error){return apiError(error)}}
