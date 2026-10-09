import "server-only";
import {ApiError} from "./http";

export function asObject(value:unknown):Record<string,unknown>{
  if(!value||typeof value!=="object"||Array.isArray(value))throw new ApiError(400,"invalid_body","Die Anfrage muss ein Objekt enthalten.");
  return value as Record<string,unknown>;
}
export function stringField(o:Record<string,unknown>,key:string,{required=true,max=500,min=0}:{required?:boolean;max?:number;min?:number}={}){
  const raw=o[key];
  if(raw==null||raw===""){if(required)throw new ApiError(400,"field_required","Eine erforderliche Angabe fehlt.");return ""}
  if(typeof raw!=="string")throw new ApiError(400,"invalid_field","Eine Angabe hat einen ungültigen Datentyp.");
  const v=raw.trim();
  if(v.length<min||v.length>max)throw new ApiError(400,"invalid_field","Eine Angabe hat eine ungültige Länge.");
  return v;
}
export function emailField(o:Record<string,unknown>,key="email"){
  const v=stringField(o,key,{max:320});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))throw new ApiError(400,"invalid_email","Bitte eine gültige E-Mail-Adresse eingeben.");
  return v.toLowerCase();
}
export function enumField<T extends string>(o:Record<string,unknown>,key:string,allowed:readonly T[]):T{
  const v=stringField(o,key,{max:100}) as T;
  if(!allowed.includes(v))throw new ApiError(400,"invalid_field","Eine Auswahl ist ungültig.");
  return v;
}
