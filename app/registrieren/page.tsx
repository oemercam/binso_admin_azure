import {redirect} from "next/navigation";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;
 const q=new URLSearchParams();
 for(const [key,value] of Object.entries(params)){if(typeof value==="string")q.set(key,value);else if(Array.isArray(value))for(const item of value)q.append(key,item)}
 redirect(`/portal/registrieren${q.size?`?${q.toString()}`:""}`)
}
