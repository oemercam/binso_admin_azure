import { InvoiceEditor } from "@/components/documents";

export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <InvoiceEditor existing documentKey={id}/>;
}
