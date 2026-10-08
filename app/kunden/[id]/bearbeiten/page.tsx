import { CustomerForm } from "@/components/pages/customers";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <CustomerForm key={id} customerId={id}/>}
