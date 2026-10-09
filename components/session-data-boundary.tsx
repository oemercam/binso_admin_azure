"use client";
import {Fragment,useEffect,useState} from 'react';
import {useApiQuery} from '@/lib/client/use-api-query';
import type {ClientSession} from '@/lib/client/session-cache';

/** Clear local forms and entity state when the authenticated person/tenant changes.
 * Background revalidation and role refreshes preserve the current subtree. */
export function SessionDataBoundary({children}:{children:React.ReactNode}){
 const query=useApiQuery<ClientSession>('/api/auth/session');
 const identity=query.data?(query.data.authenticated?JSON.stringify([query.data.tenant?.id,query.data.user?.id]):'signed-out'):null;
 const [confirmed,setConfirmed]=useState('initial');
 useEffect(()=>{if(identity!==null)queueMicrotask(()=>setConfirmed(identity));},[identity]);
 return <Fragment key={identity??confirmed}>{children}</Fragment>;
}
