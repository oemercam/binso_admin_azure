import { SupportChat } from "@/components/pages/support";

export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <SupportChat key={id} ticketId={id}/>;
}
