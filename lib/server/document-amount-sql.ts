import 'server-only';
/** Fixed business-table expressions, shared by list/detail and report aggregates.
 * Aliases/placeholders are internal SQL structure, never request input. */
function alias(value:string){if(!/^[a-z][a-z0-9_]*$/i.test(value))throw new Error('Invalid internal document alias');return value;}
export function offerTotalSql(documentAlias:string){const d=alias(documentAlias);return `coalesce((select round(sum(l.quantity*l.unit_price),2)+round(sum(l.quantity*l.unit_price*l.vat_rate/100),2) from quote_lines l where l.quote_id=${d}.id and l.organization_id=${d}.organization_id),0)`;}
export function offerStatusSql(documentAlias:string,todayParameter:string){const d=alias(documentAlias);if(!/^\$[1-9]\d*$/.test(todayParameter))throw new Error('Invalid internal date parameter');return `case when ${d}.status='sent' and ${d}.valid_until::date<${todayParameter}::date then 'expired' else ${d}.status end`;}
