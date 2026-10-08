import { CustomerDetail } from "@/components/app-pages";

export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <CustomerDetail key={id} customerId={id}/>;
}
