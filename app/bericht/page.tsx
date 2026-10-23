import type {Metadata} from 'next';
import {PublicReport} from '@/components/public-report';
import {localizeMetadata} from '@/lib/server/locale';
export async function generateMetadata():Promise<Metadata>{return localizeMetadata({title:'Bericht',robots:{index:false,follow:false},referrer:'no-referrer'},'/bericht');}
export default function ReportPage(){return <PublicReport/>;}
