import {CommercialContractDetail} from '@/components/commercial-contracts';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <CommercialContractDetail key={id} contractId={id}/>;}
