import { OperatorPage } from "@/components/operator";
import { requireOperator } from "@/lib/server/operator";

export default async function Page(){
  await requireOperator();
  return <OperatorPage/>;
}
