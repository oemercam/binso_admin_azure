export type TenantRole="owner"|"admin"|"finance"|"hr"|"project_manager"|"manager"|"member"|"reader";
export type LocalUserRole="Inhaber"|"Admin"|"Finanzen"|"Personal"|"Projektleitung"|"Mitarbeiter"|"Lesen";

export type TenantPermission=
 |"organization:read"|"organization:write"|"users:read"|"users:manage"|"billing:read"|"billing:write"|"audit:read"
 |"customers:read"|"customers:write"|"customers:delete"
 |"sales:read"|"sales:write"|"invoices:read"|"invoices:write"|"payments:read"|"payments:write"
 |"projects:read"|"projects:write"|"time:read"|"time:write"|"expenses:read"|"expenses:write"|"tasks:read"|"tasks:write"
 |"purchasing:read"|"purchasing:write"|"accounting:read"|"accounting:write"|"bank:read"|"bank:write"|"vat:read"|"vat:write"|"reports:read"
 |"employees:read"|"employees:write"|"absence:read"|"absence:write"|"payroll:read"|"payroll:write"
 |"masterdata:read"|"masterdata:write"|"documents:read"|"documents:write"|"contracts:read"|"contracts:write"
 |"support:read"|"support:write"|"feedback:write";

const allPermissions:TenantPermission[]=[
 "organization:read","organization:write","users:read","users:manage","billing:read","billing:write","audit:read",
 "customers:read","customers:write","customers:delete","sales:read","sales:write","invoices:read","invoices:write","payments:read","payments:write",
 "projects:read","projects:write","time:read","time:write","expenses:read","expenses:write","tasks:read","tasks:write",
 "purchasing:read","purchasing:write","accounting:read","accounting:write","bank:read","bank:write","vat:read","vat:write","reports:read",
 "employees:read","employees:write","absence:read","absence:write","payroll:read","payroll:write",
 "masterdata:read","masterdata:write","documents:read","documents:write","contracts:read","contracts:write"
];

const baseRead:TenantPermission[]=["organization:read","customers:read","sales:read","invoices:read","projects:read","tasks:read","masterdata:read","documents:read","contracts:read","reports:read"];

export const tenantGrants:Record<TenantRole,ReadonlySet<TenantPermission>>={
 owner:new Set(allPermissions),
 admin:new Set(allPermissions.filter(p=>p!=="billing:write")),
 finance:new Set([
  "organization:read","users:read","billing:read","customers:read","customers:write","sales:read","invoices:read","invoices:write","payments:read","payments:write",
  "purchasing:read","purchasing:write","accounting:read","accounting:write","bank:read","bank:write","vat:read","vat:write","reports:read","documents:read","documents:write","contracts:read"
 ]),
 hr:new Set(["organization:read","users:read","employees:read","employees:write","absence:read","absence:write","payroll:read","payroll:write","documents:read","documents:write","reports:read"]),
 project_manager:new Set(["organization:read","customers:read","customers:write","sales:read","sales:write","projects:read","projects:write","time:read","time:write","expenses:read","expenses:write","tasks:read","tasks:write","masterdata:read","documents:read","documents:write","contracts:read","reports:read"]),
 manager:new Set(["organization:read","customers:read","customers:write","sales:read","sales:write","projects:read","projects:write","time:read","time:write","expenses:read","expenses:write","tasks:read","tasks:write","masterdata:read","documents:read","documents:write","contracts:read","reports:read"]),
 member:new Set(["organization:read","customers:read","projects:read","time:read","time:write","expenses:read","expenses:write","tasks:read","tasks:write","masterdata:read","documents:read"]),
 reader:new Set(baseRead)
};

export function normalizeTenantRole(role:string):TenantRole{
 if(role==="manager")return "project_manager";
 return (["owner","admin","finance","hr","project_manager","member","reader"] as string[]).includes(role)?role as TenantRole:"reader";
}
const universalTenantPermissions=new Set<TenantPermission>(["support:read","support:write","feedback:write"]);
export function tenantCan(role:string,permission:TenantPermission){return universalTenantPermissions.has(permission)||tenantGrants[normalizeTenantRole(role)].has(permission)}
export function tenantPermissions(role:string){return Array.from(new Set([...tenantGrants[normalizeTenantRole(role)],...universalTenantPermissions]))}

export function localRoleToTenant(role:LocalUserRole|string):TenantRole{
 const map:Record<string,TenantRole>={Inhaber:"owner",Admin:"admin",Finanzen:"finance",Personal:"hr",Projektleitung:"project_manager",Mitarbeiter:"member",Lesen:"reader"};
 return map[role]||"reader";
}

export const modulePermissionMap:Record<string,{read:TenantPermission;write:TenantPermission}>={
 kunden:{read:"customers:read",write:"customers:write"},
 offerten:{read:"sales:read",write:"sales:write"},auftraege:{read:"sales:read",write:"sales:write"},
 rechnungen:{read:"invoices:read",write:"invoices:write"},zahlungen:{read:"payments:read",write:"payments:write"},
 projekte:{read:"projects:read",write:"projects:write"},zeiterfassung:{read:"time:read",write:"time:write"},spesen:{read:"expenses:read",write:"expenses:write"},aufgaben:{read:"tasks:read",write:"tasks:write"},
 lieferanten:{read:"purchasing:read",write:"purchasing:write"},eingangsrechnungen:{read:"purchasing:read",write:"purchasing:write"},
 buchhaltung:{read:"accounting:read",write:"accounting:write"},bank:{read:"bank:read",write:"bank:write"},mwst:{read:"vat:read",write:"vat:write"},berichte:{read:"reports:read",write:"reports:read"},
 personal:{read:"employees:read",write:"employees:write"},abwesenheiten:{read:"absence:read",write:"absence:write"},lohn:{read:"payroll:read",write:"payroll:write"},
 produkte:{read:"masterdata:read",write:"masterdata:write"},dokumente:{read:"documents:read",write:"documents:write"},vertraege:{read:"contracts:read",write:"contracts:write"},
 einstellungen:{read:"organization:read",write:"organization:write"},support:{read:"support:read",write:"support:write"}
};

export function permissionForModule(moduleKey:string,action:"read"|"write"){return modulePermissionMap[moduleKey]?.[action]}
export function routePermission(pathname:string):TenantPermission|undefined{
 if(pathname.startsWith("/einstellungen"))return "organization:read";
 const segment=pathname.split("/").filter(Boolean)[0]||"dashboard";
 if(segment==="dashboard")return "organization:read";
 return permissionForModule(segment,"read");
}
export function ownRecordOnly(role:string,moduleKey:string){
 return normalizeTenantRole(role)==="member"&&["zeiterfassung","spesen","aufgaben"].includes(moduleKey);
}

export type OperatorRole="platform_owner"|"platform_admin"|"support"|"billing"|"security_auditor";
export type OperatorPermission="platform:read"|"organizations:read"|"organizations:manage"|"subscriptions:read"|"subscriptions:manage"|"operators:read"|"operators:manage"|"platform_audit:read"|"support:manage"|"feedback:manage"|"feature_flags:manage"|"announcements:manage";
export const operatorGrants:Record<OperatorRole,ReadonlySet<OperatorPermission>>={
 platform_owner:new Set(["platform:read","organizations:read","organizations:manage","subscriptions:read","subscriptions:manage","operators:read","operators:manage","platform_audit:read","support:manage","feedback:manage","feature_flags:manage","announcements:manage"]),
 platform_admin:new Set(["platform:read","organizations:read","organizations:manage","subscriptions:read","subscriptions:manage","operators:read","operators:manage","platform_audit:read","support:manage","feedback:manage","feature_flags:manage","announcements:manage"]),
 support:new Set(["platform:read","organizations:read","support:manage","feedback:manage"]),
 billing:new Set(["platform:read","organizations:read","subscriptions:read","subscriptions:manage"]),
 security_auditor:new Set(["platform:read","organizations:read","operators:read","platform_audit:read"])
};
export function operatorCan(role:OperatorRole|string,permission:OperatorPermission){return operatorGrants[(role in operatorGrants?role:"support") as OperatorRole].has(permission)}
export function operatorPermissions(role:OperatorRole|string){return Array.from(operatorGrants[(role in operatorGrants?role:"support") as OperatorRole])}
