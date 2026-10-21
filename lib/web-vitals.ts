/** Current Core Web Vitals contract, shared by browser and ingestion. FID is retired in favor of INP. */
export const webVitalNames=new Set(['CLS','FCP','INP','LCP','TTFB']);
export const webVitalRatings=new Set(['good','needs-improvement','poor']);
export function validWebVital(value:unknown):value is {name:string;value:number;rating:string;route:string}{
 if(!value||typeof value!=='object')return false;
 const record=value as Record<string,unknown>;
 return typeof record.name==='string'&&webVitalNames.has(record.name)&&typeof record.value==='number'&&Number.isFinite(record.value)&&record.value>=0&&typeof record.rating==='string'&&webVitalRatings.has(record.rating)&&typeof record.route==='string'&&record.route.startsWith('/')&&!record.route.startsWith('//')&&record.route.length<=160&&!/[?#]/.test(record.route);
}
