import "server-only";
import type {PoolClient} from "pg";
export async function createNotification(client:PoolClient,input:{organizationId:string;userId?:string|null;kind:string;title:string;message:string;href?:string|null}){await client.query(`insert into notifications(organization_id,user_id,kind,title,message,href) values($1,$2,$3,$4,$5,$6)`,[input.organizationId,input.userId||null,input.kind,input.title,input.message,input.href||null])}
