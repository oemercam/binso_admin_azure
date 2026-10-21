"use client";
import {apiPatch,ClientApiError} from './backend';
import {type Locale} from '@/lib/locales/config';
/** A successful HTTP status alone is not proof of the persisted preference. */
export async function persistLanguagePreference(locale:Locale,scope:"tenant"|"operator"="tenant"){
 await apiPatch(scope==='operator'?'/api/operator/preferences':'/api/settings/profile',{language:locale},value=>{
  if((value as {item?:{language?:unknown}}|null)?.item?.language!==locale)throw new ClientApiError('Sprache konnte nicht gespeichert werden.','invalid_response',502);
 });
 return locale;
}
