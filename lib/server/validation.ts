import "server-only";

export function asObject(value:unknown):Record<string,unknown>{
  if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Invalid request body.");
  return value as Record<string,unknown>;
}
export function stringField(o:Record<string,unknown>,key:string,{required=true,max=500,min=0}:{required?:boolean;max?:number;min?:number}={}){
  const raw=o[key];
  if(raw==null||raw===""){if(required)throw new Error(`${key} is required.`);return ""}
  if(typeof raw!=="string")throw new Error(`${key} must be a string.`);
  const v=raw.trim();
  if(v.length<min||v.length>max)throw new Error(`${key} has invalid length.`);
  return v;
}
export function emailField(o:Record<string,unknown>,key="email"){
  const v=stringField(o,key,{max:320});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))throw new Error("Invalid email.");
  return v.toLowerCase();
}
export function enumField<T extends string>(o:Record<string,unknown>,key:string,allowed:readonly T[]):T{
  const v=stringField(o,key,{max:100}) as T;
  if(!allowed.includes(v))throw new Error(`${key} is invalid.`);
  return v;
}
