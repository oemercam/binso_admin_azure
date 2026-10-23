'use client';
import {AuthWorkspace} from './auth-workspace';
import {Button} from './ui';
import {LocalizedText} from '@/lib/client/locale';

/** Shared public/recovery presentation; never renders error objects or stacks. */
export function SystemState({title,description,code,onRetry,primaryHref='/dashboard',primaryLabel='Erneut versuchen',reference}:{title:string;description:string;code?:string;onRetry?:()=>void;primaryHref?:string;primaryLabel?:string;reference?:string}){
 const safeReference=typeof reference==='string'&&/^[a-zA-Z0-9-]{1,64}$/.test(reference)?reference:null;
 return <AuthWorkspace variant="message"><section className="auth-card error-state" aria-labelledby="system-state-title">{code&&<span className="error-code">{code}</span>}<h1 id="system-state-title"><LocalizedText>{title}</LocalizedText></h1><p><LocalizedText>{description}</LocalizedText></p>{safeReference&&<p><LocalizedText>Referenz</LocalizedText>: {safeReference}</p>}<Button href={onRetry?undefined:primaryHref} onClick={onRetry}><LocalizedText>{primaryLabel}</LocalizedText></Button><Button href="/" variant="secondary"><LocalizedText>Zur Website</LocalizedText></Button></section></AuthWorkspace>;
}
