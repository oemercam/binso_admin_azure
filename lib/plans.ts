import {planCatalog} from '@/config/plans';
import {planIds,type PlanId} from '@/config/domain';
export type {BillingCycle,PlanId} from '@/config/domain';
export type PricingPlan={id:PlanId;name:string;monthly:number;yearly:number;popular?:boolean;description:string;features:string[]};
export const plans:PricingPlan[]=planIds.map(id=>({id,name:planCatalog[id].name,monthly:planCatalog[id].monthly,yearly:planCatalog[id].yearly,description:planCatalog[id].description,popular:id==='business',features:[...planCatalog[id].marketing]}));
