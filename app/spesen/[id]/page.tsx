import { ExpenseForm } from "@/components/pages/expenses";

export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <ExpenseForm key={id} existing expenseId={id}/>;
}
