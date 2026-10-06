import {NextRequest} from "next/server";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {requireTenantFeature} from "@/lib/server/database";
import {authorize} from "@/lib/server/rbac";
import {saveCustomerContact,archiveCustomerContact} from "@/lib/server/repositories/contacts";
type Params={params:Promise<{id:string;contactId:string}>};
export async function PATCH(request:NextRequest,{params}:Params){
 try{assertSameOrigin(request);const {session}=await requireTenantFeature("customer_contacts");authorize(session,"customers:write");const {id,contactId}=await params;const body=await readJson<Parameters<typeof saveCustomerContact>[3]>(request,16384);return json({item:await saveCustomerContact(session,id,contactId,body)});}catch(e){return apiError(e);}
}
export async function DELETE(request:NextRequest,{params}:Params){
 try{assertSameOrigin(request);const {session}=await requireTenantFeature("customer_contacts");authorize(session,"customers:write");const {id,contactId}=await params;return json({item:await archiveCustomerContact(session,id,contactId)});}catch(e){return apiError(e);}
}
