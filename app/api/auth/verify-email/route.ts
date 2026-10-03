import {NextRequest,NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {query} from "@/lib/server/db";
export async function GET(request:NextRequest){
 const value=request.nextUrl.searchParams.get("token")??"";const h=createHash("sha256").update(value).digest("hex");
 const r=await query<{user_id:string}>(`delete from auth_tokens where token_hash=$1 and token_type='verify_email' and expires_at>now() returning user_id`,[h]);
 if(r.rows[0])await query("update auth.users set email_confirmed_at=coalesce(email_confirmed_at,now()),updated_at=now() where id=$1",[r.rows[0].user_id]);
 const target=new URL("/login",request.url);target.searchParams.set(r.rows[0]?"verified":"verification","1");return NextResponse.redirect(target);
}
