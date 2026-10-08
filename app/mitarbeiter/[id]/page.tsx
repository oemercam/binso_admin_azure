import { EmployeeForm } from "@/components/pages/employees";

export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <EmployeeForm key={id} existing employeeId={id}/>;
}
