import 'server-only';
import {cookies} from 'next/headers';
import type {Metadata} from 'next';
import {asLocale,localeCookie,translateMessage} from '@/lib/locales';
export async function localizeMetadata(metadata:Metadata,route='/'):Promise<Metadata>{
 const locale=asLocale((await cookies()).get(localeCookie)?.value);
 const t=(value:string)=>translateMessage(value,locale);
 const title=typeof metadata.title==='string'?t(metadata.title):metadata.title;
 const graph=metadata.openGraph;
 const twitter=metadata.twitter;
 return {...metadata,title,description:metadata.description?t(metadata.description):metadata.description,
  alternates:{...metadata.alternates,canonical:locale==='de'?route:route+'?lang='+locale,languages:{'de-CH':route,'fr-CH':route+'?lang=fr','it-CH':route+'?lang=it','en-CH':route+'?lang=en','x-default':route}},
  ...(twitter?{twitter:{...twitter,title:typeof twitter.title==='string'?t(twitter.title):twitter.title,description:twitter.description?t(twitter.description):twitter.description}}:{}),
  ...(graph?{openGraph:{...graph,title:typeof graph.title==='string'?t(graph.title):graph.title,description:graph.description?t(graph.description):graph.description,locale:{de:'de_CH',fr:'fr_CH',it:'it_CH',en:'en_CH'}[locale]}}:{}),
 };
}
