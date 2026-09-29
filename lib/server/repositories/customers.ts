import "server-only";
import { randomUUID } from "node:crypto";
import { withTenant } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";

export type CustomerInput={name:string;contact?:string;email?:string;phone?:string;address?:string;zipCity?:string;uid?:string;language?:string;paymentDays?:number;discount?:number;status?:string};

export async function listCustomers(organizationId:string,userId:string){
  return withTenant(organizationId,userId,async client=>{
    const result=await client.query(
      `select id,name,contact,email,phone,address,zip_city as "zipCity",uid,language,
              payment_days as "paymentDays",discount,status,created_at as "createdAt",updated_at as "updatedAt"
         from customers where organization_id=$1 order by lower(name) asc limit 500`,
      [organizationId]
    );
    return result.rows;
  });
}
export async function createCustomer(organizationId:string,userId:string,input:CustomerInput){
  return withTenant(organizationId,userId,async client=>{
    const id=randomUUID();
    const result=await client.query(
      `insert into customers (id,organization_id,name,contact,email,phone,address,zip_city,uid,language,payment_days,discount,status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       returning *`,
      [id,organizationId,input.name,input.contact||null,input.email||null,input.phone||null,input.address||null,input.zipCity||null,input.uid||null,input.language||"de",input.paymentDays??30,input.discount??0,input.status||"active"]
    );
    await audit(client,{organizationId,userId,action:"customer.created",entityType:"customer",entityId:id});
    return result.rows[0];
  });
}
export async function updateCustomer(organizationId:string,userId:string,id:string,input:Partial<CustomerInput>){
  return withTenant(organizationId,userId,async client=>{
    const current=await client.query("select * from customers where id=$1 and organization_id=$2",[id,organizationId]);
    if(!current.rows[0])return null;
    const c=current.rows[0] as Record<string,unknown>;
    const result=await client.query(
      `update customers set name=$1,contact=$2,email=$3,phone=$4,address=$5,zip_city=$6,uid=$7,language=$8,payment_days=$9,discount=$10,status=$11,updated_at=now()
       where id=$12 and organization_id=$13 returning *`,
      [input.name??c.name,input.contact??c.contact,input.email??c.email,input.phone??c.phone,input.address??c.address,input.zipCity??c.zip_city,input.uid??c.uid,input.language??c.language,input.paymentDays??c.payment_days,input.discount??c.discount,input.status??c.status,id,organizationId]
    );
    await audit(client,{organizationId,userId,action:"customer.updated",entityType:"customer",entityId:id});
    return result.rows[0];
  });
}
export async function deleteCustomer(organizationId:string,userId:string,id:string){
  return withTenant(organizationId,userId,async client=>{
    const result=await client.query("delete from customers where id=$1 and organization_id=$2 returning id",[id,organizationId]);
    if(result.rowCount)await audit(client,{organizationId,userId,action:"customer.deleted",entityType:"customer",entityId:id});
    return Boolean(result.rowCount);
  });
}
