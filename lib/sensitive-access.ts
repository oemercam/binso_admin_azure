import type {TenantRole} from './permissions';

export const sensitiveCapabilities=['hr_sensitive:read','hr_sensitive:write','family:read','family:write','payroll:read','payroll:write','payroll:review','payroll:payment'] as const;
export type SensitiveCapability=typeof sensitiveCapabilities[number];
export function isSensitiveCapability(value:unknown):value is SensitiveCapability{return typeof value==='string'&&sensitiveCapabilities.some(capability=>capability===value);}
export function eligibleSensitiveCapabilities(role:string):SensitiveCapability[]{
 if(['owner','admin','hr'].includes(role))return sensitiveCapabilities.filter(capability=>role!=='hr'||capability!=='payroll:payment');
 if(role==='finance')return sensitiveCapabilities.filter(capability=>capability.startsWith('payroll:'));
 return [];
}
export function sensitiveGrantIssue(role:TenantRole|string,value:unknown):string|null{
 if(!Array.isArray(value)||value.length>8||value.some(item=>!isSensitiveCapability(item))||new Set(value).size!==value.length)return 'Die Fachrechte sind ungültig.';
 const allowed=eligibleSensitiveCapabilities(role);
 if(value.some(capability=>!allowed.includes(capability)))return 'Diese Fachrechte passen nicht zur gewählten Rolle.';
 for(const [write,read] of [['hr_sensitive:write','hr_sensitive:read'],['family:write','family:read'],['payroll:write','payroll:read'],['payroll:review','payroll:read'],['payroll:payment','payroll:read']])if(value.includes(write)&&!value.includes(read))return 'Zum Bearbeiten oder Freigeben muss auch das entsprechende Leserecht ausgewählt sein.';
 return null;
}
