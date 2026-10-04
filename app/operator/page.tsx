import { OperatorPage } from "@/components/operator";
import { requireOperator } from "@/lib/server/operator";

export default async function Page(){
  const access=await requireOperator();
  return <OperatorPage demo={access.prototype}/>;
}
