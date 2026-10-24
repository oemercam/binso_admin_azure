"use client";
import {Fragment,useEffect} from 'react';
import {useApiQuery} from '@/lib/client/use-api-query';
import type {ClientSession} from '@/lib/client/session-cache';
import {ErrorState} from './ui';
import {usePathname,useRouter} from 'next/navigation';

/** Clear local forms and entity state when the authenticated person/tenant changes.
 * Background revalidation and role refreshes preserve the current subtree. */
export function SessionDataBoundary({children}:{children:React.ReactNode}){
 const query=useApiQuery<ClientSession>('/api/auth/session');
 const pathname=usePathname(),router=useRouter();
 const enrollmentRequired=query.data?.security?.enrollmentRequired===true;
 useEffect(()=>{if(enrollmentRequired&&pathname!=='/einstellungen/sicherheit')router.replace('/einstellungen/sicherheit?next='+encodeURIComponent(pathname));},[enrollmentRequired,pathname,router]);
 const identity=query.data?.authenticated?JSON.stringify([query.data.tenant?.id,query.data.user?.id]):null;
 // Mount private page state only after the first identity is known. Previously
 // initial -> identity remounted the entire page and repeated its initial reads.
 if(identity===null)return query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:null;
 if(enrollmentRequired&&pathname!=='/einstellungen/sicherheit')return null;
 return <Fragment key={identity}>{children}</Fragment>;
}
