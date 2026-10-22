import {SupplierForm} from '@/components/pages/suppliers';
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;return <SupplierForm key={id} supplierId={id}/>;
}
