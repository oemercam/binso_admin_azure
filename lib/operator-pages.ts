import {operatorCan,type OperatorRole,type OperatorPermission} from './permissions';

/** Page access follows the same grants as the corresponding APIs. */
export const operatorPages:Record<string,OperatorPermission>={
 '':'platform:read',tickets:'support:manage',kunden:'organizations:read',
 zahlungen:'subscriptions:read',finanzen:'subscriptions:read',abonnemente:'subscriptions:read',
 sperrungen:'restrictions:manage',monitoring:'platform:read',ankuendigungen:'announcements:manage',
 sicherheit:'operators:read',audit:'platform_audit:read',
};
export function validOperatorSection(section:string){
 const parts=section.split('/');
 return Object.hasOwn(operatorPages,parts[0])&&(parts.length===1||parts.length===2&&['tickets','kunden'].includes(parts[0])&&Boolean(parts[1]));
}
export function canOpenOperatorSection(role:OperatorRole|'readonly',section:string){
 const permission=operatorPages[section.split('/')[0]];
 return Boolean(permission&&operatorCan(role,permission));
}
