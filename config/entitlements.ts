export type EntitlementKey=
 |"feature.invoicing"|"feature.timeTracking"|"feature.expenses"|"feature.hr"|"feature.advancedReporting"
 |"limit.users"|"limit.projects";
export type PlanKey="start"|"business"|"pro";
const entitlements:Record<PlanKey,Record<EntitlementKey,boolean|number>>={
 start:{"feature.invoicing":true,"feature.timeTracking":true,"feature.expenses":true,"feature.hr":false,"feature.advancedReporting":false,"limit.users":3,"limit.projects":100},
 business:{"feature.invoicing":true,"feature.timeTracking":true,"feature.expenses":true,"feature.hr":true,"feature.advancedReporting":true,"limit.users":15,"limit.projects":1000},
 pro:{"feature.invoicing":true,"feature.timeTracking":true,"feature.expenses":true,"feature.hr":true,"feature.advancedReporting":true,"limit.users":Number.MAX_SAFE_INTEGER,"limit.projects":Number.MAX_SAFE_INTEGER},
};
export function entitlement(plan:PlanKey,key:EntitlementKey){return entitlements[plan][key]}
