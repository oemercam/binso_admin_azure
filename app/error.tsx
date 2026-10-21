'use client';
import {SystemState} from '@/components/system-state';
export default function Error({error,reset}:{error:Error & {digest?:string};reset:()=>void}){return <SystemState title="Etwas ist schiefgelaufen" description="Die Seite konnte nicht vollständig geladen werden." reference={error.digest} onRetry={reset}/>;}
