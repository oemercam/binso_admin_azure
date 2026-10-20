import type {PlanId} from '@/config/domain';
import {planCatalog} from '@/config/plans';
export function subscriptionEntitlements(plan:PlanId){
 const {limits,features}=planCatalog[plan];
 return {...limits,features:[...features]};
}
