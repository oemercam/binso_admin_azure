"use client";
import {useEffect,useState} from 'react';
import {useApiQuery,useDataRevision} from '@/lib/client/use-api-query';
import {usePageAccess} from '@/lib/client/page-access';
import {directoryQuery} from '@/lib/directory-query';
import {Select} from './ui';
import {LocalizedText} from '@/lib/client/locale';

type Item={id:string;total?:unknown;paid_amount?:unknown;credit_amount?:unknown;refund_amount?:unknown;[key:string]:unknown};
type Page={items:Item[];total?:number};
/** Remote data adapter for the existing app select; no separate dropdown/sheet owner. */
export function DirectorySelect({endpoint,value,onChange,label,emptyLabel='Auswählen',required=false,disabled=false,customerId,selectedLabel,selectable=()=>true,formatOption=record=>String(record.name??record.number??record.id)}:{endpoint:string|null;value:string;onChange:(value:string,item?:Item)=>void;label:string;emptyLabel?:string;required?:boolean;disabled?:boolean;customerId?:string|null;selectedLabel?:string;selectable?:(record:Item)=>boolean;formatOption?:(record:Item)=>string}){
 const access=usePageAccess(),session=useDataRevision([]);
 const [query,setQuery]=useState(''),[debounced,setDebounced]=useState(''),[page,setPage]=useState(0);
 useEffect(()=>{let active=true;queueMicrotask(()=>{if(active){setQuery('');setDebounced('');setPage(0)}});return()=>{active=false}},[endpoint,customerId,session]);
 useEffect(()=>{const timer=window.setTimeout(()=>setDebounced(query),180);return()=>window.clearTimeout(timer)},[query]);
 const result=useApiQuery<Page>(endpoint&&!disabled?directoryQuery(endpoint,{query:debounced,page,customerId}):null);
 const selected=useApiQuery<Page>(endpoint&&value&&!selectedLabel?directoryQuery(endpoint,{id:value,customerId}):null);
 const [choice,setChoice]=useState<{endpoint:string;session:string;item:Item}|null>(null);
 const items=result.data?.items??[];
 const current=selectedLabel&&value?{id:value,name:selectedLabel,number:selectedLabel}:selected.data?.items.find(item=>item.id===value)??items.find(item=>item.id===value)??(choice?.endpoint===endpoint&&choice.session===session&&choice.item.id===value?choice.item:undefined);
 const options=current&&!items.some(item=>item.id===value)?[current,...items]:items;
 const total=result.data?.total;
 return <Select required={required} disabled={disabled||!access.write} aria-label={label} value={value} onChange={event=>{const id=event.target.value,item=options.find(item=>item.id===id);if(item&&!selectable(item))return;if(item&&endpoint)setChoice({endpoint,session,item});onChange(id,item)}} search={{value:query,onChange:text=>{setQuery(text);setPage(0)},loading:result.loading||query!==debounced,error:result.error??selected.error,onRetry:()=>{result.refresh();selected.refresh()},page,hasNext:total!==undefined?(page+1)*50<total:items.length===50,onPage:setPage}}>
  <option value=""><LocalizedText>{emptyLabel}</LocalizedText></option>
  {value&&!current&&<option value={value} disabled>{selected.loading?'…':label}</option>}
  {options.map(item=><option key={item.id} value={item.id} hidden={!items.some(row=>row.id===item.id)} disabled={!selectable(item)}>{formatOption(item)}</option>)}
 </Select>;
}
