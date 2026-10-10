/** Pure fixtures; never writes to a database. Caller must intercept API requests. */
export const fixtureCases=['empty','few','large','partial','positive','negative','no-expenses','invalid','owner','admin','finance','employee','interrupted'];
export function fixtureCase(name,tenant='ux-tenant-a'){
 if(!fixtureCases.includes(name)||!/^ux-tenant-[ab]$/.test(tenant))throw Error('Unknown synthetic fixture/tenant');
 const customer={id:tenant+'-customer-1',tenant_id:tenant,name:'Synthetic UX Company',email:'ux@example.invalid'};
 const count=name==='empty'?0:name==='large'?500:3;
 const customers=Array.from({length:count},(_,i)=>({...customer,id:tenant+'-customer-'+(i+1),name:'Synthetic UX '+String(i+1).padStart(4,'0')}));
 const invoices=Array.from({length:count},(_,i)=>({id:tenant+'-invoice-'+i,tenant_id:tenant,customer_id:customer.id,total:100+i,status:name==='partial'?'partial':['draft','sent','paid','cancelled'][i%4],paid_amount:name==='partial'?25:i%4===2?100+i:0}));
 const date='2026-10-01',income=name==='negative'?25:200,costs=name==='no-expenses'?0:name==='negative'?100:50;
 return {tenant,role:['owner','admin','finance','employee'].includes(name)?name:'owner',customers,invoices,cash:{payments:name==='empty'?[]:[{payment_date:date,amount:income}],outflows:name==='empty'||!costs?[]:[{payment_date:date,amount:costs}],incomplete:false},invalid:name==='invalid'?{name:'',email:'invalid',amount:-1}:null,recovery:name==='interrupted'?{key:tenant+'-request-1',committed:true,responseLost:true}:null};
}
