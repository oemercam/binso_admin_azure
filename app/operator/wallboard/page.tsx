import {redirect} from 'next/navigation';
import {getOperatorSession,requireOperatorSession} from '@/lib/server/operator/session';
import {authorizeOperator} from '@/lib/server/operator/rbac';
import {MonitoringPanel} from '@/components/monitoring';
export const metadata={title:'Monitoring Wallboard'};
export default async function Page(){
 if(!await getOperatorSession())redirect('/operator/login');
 const session=await requireOperatorSession();authorizeOperator(session,'platform:read');
 return <main className="bo-wallboard-root" data-operator-demo="false"><MonitoringPanel wallboard/></main>;
}
