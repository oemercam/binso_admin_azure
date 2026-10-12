import { OperatorPage } from "@/components/operator";
import { requireOperator } from "@/lib/server/operator";
import {notFound} from 'next/navigation';
import {validOperatorSection} from '@/lib/operator-pages';

export default async function Page({params}:{params:Promise<{section:string[]}>}){
  const access=await requireOperator();
  const {section}=await params;
  const path=section.join('/');
  if(!validOperatorSection(path))notFound();
  return <OperatorPage section={path} demo={access.prototype} identity={access.identity} role={access.role}/>;
}
