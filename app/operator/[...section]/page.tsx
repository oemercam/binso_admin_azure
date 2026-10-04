import { OperatorPage } from "@/components/operator";
import { requireOperator } from "@/lib/server/operator";

export default async function Page({params}:{params:Promise<{section:string[]}>}){
  const access=await requireOperator();
  const {section}=await params;
  return <OperatorPage section={section.join("/")} demo={access.prototype}/>;
}
