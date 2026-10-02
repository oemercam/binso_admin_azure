import { SupportChat } from "@/components/app-pages";

export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <SupportChat ticketId={id}/>;
}
