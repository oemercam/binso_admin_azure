import type {PlanId} from '@/config/domain';
export function subscriptionEntitlements(plan:PlanId){
 const common=['crm','quotes','orders','time','invoices','expenses'];
 const business=[...common,'finance','employees','accounting','projects','suppliers','documents'];
 return {
  features:plan==='start'?common:plan==='business'?business:[...business,'contracts','payroll','audit','exports','api','automations'],
  users:plan==='start'?3:plan==='business'?15:10000,
  storageMb:plan==='start'?1024:plan==='business'?5120:20480,
  monthlyDocuments:plan==='start'?100:plan==='business'?1000:10000,
  monthlyApiRequests:plan==='start'?10000:plan==='business'?100000:1000000,
 };
}
