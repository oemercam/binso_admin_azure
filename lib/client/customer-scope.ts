'use client';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {useApiQuery} from './use-api-query';
import {safeAppPath} from '@/lib/navigation';

/** One existing URL/API contract for global lists opened from a customer. */
export function useCustomerScope(){
 const params=useSearchParams(),pathname=usePathname(),router=useRouter();
 const customerId=params.get('customerId');
 const customer=useApiQuery<{item?:{name?:string}}>(customerId?'/api/customers/'+encodeURIComponent(customerId):null);
 const returnTo=customerId?safeAppPath(params.get('returnTo'),'/kunden/'+encodeURIComponent(customerId)):undefined;
 const listReturn=pathname+(params.toString()?'?'+params.toString():'');
 const clear=()=>{const next=new URLSearchParams(params.toString());next.delete('customerId');next.delete('returnTo');router.replace(pathname+(next.size?'?'+next.toString():''),{scroll:false});};
 return {customerId,returnTo,listReturn,scope:customerId?{label:'Kunde',value:customer.data?.item?.name??'—',error:customer.error,onClear:clear}:undefined,detailHref:(href:string)=>href+(href.includes('?')?'&':'?')+'returnTo='+encodeURIComponent(listReturn)};
}
