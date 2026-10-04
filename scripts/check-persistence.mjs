import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const base=(process.env.BINSO_BASE_URL??'http://127.0.0.1:3000').replace(/\/$/,'');
function sessionClient(){
 const cookies=new Map();
 return async(path,method='GET',body,expected=200,headers={})=>{
  const multipart=body instanceof FormData;
  const response=await fetch(base+path,{method,headers:{...(multipart?{}:{'Content-Type':'application/json'}),Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; '),...headers},body:body===undefined?undefined:multipart?body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  for(const cookie of response.headers.getSetCookie()){const pair=cookie.split(';')[0],i=pair.indexOf('=');cookies.set(pair.slice(0,i),pair.slice(i+1));}
  assert.equal(response.status,expected,method+' '+path+' returned unexpected status');
  return response.headers.get('content-type')?.includes('application/json')?response.json():response.arrayBuffer();
 };
}
const a=sessionClient(),b=sessionClient(),suffix=randomUUID().slice(0,8),today=new Date().toISOString().slice(0,10);
try{
 for(const client of [a,b]){const demo=await client('/api/demo/session','POST',{});assert.equal(demo.databaseBacked,true,'Database-backed sandbox is required');const auth=await client('/api/auth/session');assert.equal(auth.demo,true);assert.equal(auth.configured,true);}
 const customerInput={name:'Persistence '+suffix,email:'customer-'+suffix+'@example.invalid',phone:'+41 00 000 00 00',city:'Zürich',postalCode:'8000',sector:'Beratung',address:'Testweg 1',uid:'TEST-'+suffix,language:'de',paymentDays:45,discount:5};
 const customer=(await a('/api/customers','POST',customerInput,201)).item;
 await a('/api/customers/'+customer.id,'PATCH',{city:'Bern',sector:'Handel'});
 const loaded=(await a('/api/customers/'+customer.id)).item;
 assert.equal(loaded.city,'Bern');assert.equal(loaded.sector,'Handel');assert.equal(loaded.email,customerInput.email);assert.equal(loaded.postal_code,'8000');
 await b('/api/customers/'+customer.id,'GET',undefined,404);
 const product=(await a('/api/products','POST',{name:'Test '+suffix,kind:'service',sku:suffix,unit:'hour',unitPrice:123.45,vatRate:8.1,description:'Persisted service',status:'inactive'},201)).item;
 assert.equal((await a('/api/products/'+product.id)).item.status,'inactive');
 const employee=(await a('/api/employees','POST',{firstName:'Anna Maria',lastName:'Beispiel',email:'employee-'+suffix+'@example.invalid',phone:'000',jobTitle:'Test',workloadPercent:80,entryDate:today,status:'active'},201)).item;
 assert.equal((await a('/api/employees/'+employee.id)).item.first_name,'Anna Maria');
 const expense=(await a('/api/expenses','POST',{employeeId:employee.id,merchant:'Test Hotel',expenseDate:today,category:'Reise',amount:123.45,currency:'CHF',vatRate:8.1,description:'Persisted expense',status:'submitted'},201)).item;
 let expenseRead=(await a('/api/expenses/'+expense.id)).item;
 assert.equal(expenseRead.category,'Reise');assert.equal(expenseRead.status,'submitted');assert.equal(expenseRead.employee_id,employee.id);
 await a('/api/expenses/'+expense.id,'PATCH',{employeeId:employee.id,merchant:'Test Hotel',expenseDate:today,category:'Verpflegung',amount:124,currency:'CHF',vatRate:2.6,description:'Updated expense',status:'approved'});
 expenseRead=(await a('/api/expenses/'+expense.id)).item;assert.equal(expenseRead.category,'Verpflegung');assert.equal(expenseRead.employee_id,employee.id);assert.equal(expenseRead.status,'approved');
 const docInput={kind:'invoice',customerId:customer.id,customerName:customerInput.name,issueDate:today,dueDate:today,vatRate:8.1,currency:'CHF',note:'Persisted note',items:[{description:'Service',quantity:2,unitPrice:100,vatRate:8.1},{description:'Material',quantity:1,unitPrice:50,vatRate:2.6}]};
 const invoice=(await a('/api/documents','POST',docInput,201)).item;
 const docRead=(await a('/api/documents/'+invoice.number)).item;
 assert.equal(docRead.customer_id,customer.id);assert.equal(docRead.note,docInput.note);assert.equal(docRead.items.length,2);assert.equal(Number(docRead.items[1].vat_rate),2.6);
 await b('/api/documents/'+invoice.number,'GET',undefined,404);
 const quote=(await a('/api/documents','POST',{...docInput,kind:'offer',validUntil:today},201)).item;assert.equal((await a('/api/documents/'+quote.number)).item.kind,'offer');
 const time=(await a('/api/time-entries','POST',{durationMinutes:37,projectName:'Persisted project label',customerName:customerInput.name,description:'Persisted activity',startedAt:today+'T12:00:00'},201)).item;
 const timeRead=(await a('/api/time-entries')).items.find(item=>item.id===time.id);assert.equal(timeRead.customer_id,customer.id);assert.equal(timeRead.project_name,'Persisted project label');assert.equal(Number(timeRead.duration_minutes),37);
 await a('/api/time-tracker','POST',{action:'start',project:'Persistent timer'});assert.equal((await a('/api/time-tracker')).tracker.project_label,'Persistent timer');await a('/api/time-tracker','POST',{action:'pause'});
 const support=(await a('/api/support/tickets','POST',{subject:'Persistence '+suffix,category:'question',priority:'normal',message:'Synthetic persisted message'},201)).item;
 assert.ok((await a('/api/support/tickets/'+support.id+'/messages')).items.length);
 await a('/api/settings/profile','PATCH',{firstName:'Demo',lastName:'Test',phone:'000',jobTitle:'Testing',language:'de',theme:'dark'});
 assert.equal((await a('/api/settings/profile')).item.theme,'dark');
 await a('/api/settings/company','PATCH',{name:'Sandbox '+suffix,city:'Bern',postalCode:'3000'});assert.equal((await a('/api/settings/company')).item.city,'Bern');
 await a('/api/settings/notifications','PATCH',{kind:'Rechnungen',channel:'email',enabled:false});assert.equal((await a('/api/settings/notifications')).items.find(item=>item.kind==='Rechnungen').email,false);
 const bytes=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jVn0AAAAASUVORK5CYII=','base64'));
 const receiptForm=new FormData();receiptForm.append('file',new Blob([bytes],{type:'image/png'}),'test-receipt.png');receiptForm.append('purpose','expense_receipt');receiptForm.append('entityId',expense.id);
 const receipt=(await a('/api/files','POST',receiptForm,201)).item;
 assert.equal(receipt.expense_id,expense.id);assert.ok((await a('/api/files?expenseId='+expense.id)).items.find(item=>item.id===receipt.id));
 assert.deepEqual(new Uint8Array(await a('/api/files/'+receipt.id+'/download')),bytes);
 await b('/api/files/'+receipt.id+'/download','GET',undefined,404);
 const avatarForm=new FormData();avatarForm.append('file',new Blob([bytes],{type:'image/png'}),'test-avatar.png');avatarForm.append('purpose','profile_avatar');
 const avatar=(await a('/api/files','POST',avatarForm,201)).item;assert.equal((await a('/api/settings/profile')).item.avatar_url,'/api/files/'+avatar.id+'/download');
 const logoForm=new FormData();logoForm.append('file',new Blob([bytes],{type:'image/png'}),'test-logo.png');logoForm.append('purpose','company_logo');
 const logo=(await a('/api/files','POST',logoForm,201)).item;assert.equal((await a('/api/settings/company')).item.logo_url,'/api/files/'+logo.id+'/download');
 await a('/api/billing/checkout','POST',{plan:'business'},403);
 console.log('Database persistence verified: field reloads, documents/lines, expenses, staff, time/timer, support, settings and sandbox tenant isolation.');
}finally{for(const client of [a,b])await client('/api/demo/session','DELETE').catch(()=>{});}
