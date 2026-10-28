/** Decimal arithmetic matching PostgreSQL numeric: round halves away from zero. */
type Decimal={units:bigint;scale:number};
const power10=(scale:number)=>BigInt("1"+"0".repeat(scale));
function decimal(value:unknown):Decimal{
 const text=String(value??0).trim()||'0';
 const match=/^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(text);
 if(!match||!(match[2]||match[3])||text.length>100)throw new RangeError('Invalid decimal amount');
 const exponent=Number(match[4]??0);if(Math.abs(exponent)>20)throw new RangeError('Decimal exponent out of range');
 const fraction=match[3]??'';let units=BigInt((match[2]||'0')+fraction)*(match[1]==='-'?-BigInt(1):BigInt(1)),scale=fraction.length-exponent;
 if(scale<0){units*=power10(-scale);scale=0;}
 return {units,scale};
}
function roundTo(value:Decimal,scale:number){
 if(value.scale<=scale)return value.units*power10(scale-value.scale);
 const divisor=power10(value.scale-scale),absolute=value.units<BigInt(0)?-value.units:value.units;
 const rounded=absolute/divisor+(absolute%divisor*BigInt(2)>=divisor?BigInt(1):BigInt(0));
 return value.units<BigInt(0)?-rounded:rounded;
}
function safeNumber(units:bigint){const number=Number(units);if(!Number.isSafeInteger(number))throw new RangeError('Amount out of safe range');return number;}
export function moneyMinor(value:unknown){return safeNumber(roundTo(decimal(value),2));}
export function roundMoney(value:unknown){return moneyMinor(value)/100;}
export function sumMoney(values:readonly unknown[]){return safeNumber(values.reduce<bigint>((sum,value)=>sum+BigInt(moneyMinor(value)),BigInt(0)))/100;}
function add(a:Decimal,b:Decimal):Decimal{const scale=Math.max(a.scale,b.scale);return {units:a.units*power10(scale-a.scale)+b.units*power10(scale-b.scale),scale};}
export function documentTotals(lines:readonly {quantity:unknown;unit_price:unknown;vat_rate:unknown}[]){
 let net:Decimal={units:BigInt(0),scale:0},tax:Decimal={units:BigInt(0),scale:0};
 for(const line of lines){const normalized=(value:unknown):Decimal=>({units:roundTo(decimal(value),2),scale:2});const q=normalized(line.quantity),p=normalized(line.unit_price),v=normalized(line.vat_rate);const product={units:q.units*p.units,scale:q.scale+p.scale};net=add(net,product);tax=add(tax,{units:product.units*v.units,scale:product.scale+v.scale+2});}
 const subtotal=roundTo(net,2),vat=roundTo(tax,2);
 return {subtotal:safeNumber(subtotal)/100,vat:safeNumber(vat)/100,total:safeNumber(subtotal+vat)/100};
}

export type Discount={kind:'none'}|{kind:'percent';value:string}|{kind:'fixed';value:string;currency:string};
type Fraction={n:bigint;d:bigint};
const fraction=(n:bigint,d=BigInt(1)):Fraction=>{if(d===BigInt(0))throw new RangeError('Division by zero');const gcd=(a:bigint,b:bigint):bigint=>b===BigInt(0)?a:gcd(b,a%b);const g=gcd(n<BigInt(0)?-n:n,d);return {n:n/g,d:d/g};};
const plus=(a:Fraction,b:Fraction)=>fraction(a.n*b.d+b.n*a.d,a.d*b.d);
const minus=(a:Fraction,b:Fraction)=>plus(a,fraction(-b.n,b.d));
const times=(a:Fraction,b:Fraction)=>fraction(a.n*b.n,a.d*b.d);
const divided=(a:Fraction,b:Fraction)=>fraction(a.n*b.d,a.d*b.n);
const compare=(a:Fraction,b:Fraction)=>a.n*b.d-b.n*a.d;
const zero=fraction(BigInt(0));
const sum=(values:Fraction[])=>values.reduce(plus,zero);
const centsOf=(v:Fraction)=>{const scaled=v.n*BigInt(100);return scaled/v.d+(scaled%v.d*BigInt(2)>=v.d?BigInt(1):BigInt(0));};
const exact=(v:Fraction)=>({numerator:String(v.n),denominator:String(v.d)});
const amount=(cents:bigint)=>{safeNumber(cents);return `${cents/BigInt(100)}.${String(cents%BigInt(100)).padStart(2,'0')}`;};
function nonnegative(value:unknown,max='999999999.99'):Fraction{
 if((typeof value!=='string'&&typeof value!=='number')||String(value).length>32||!/^\d+(\.\d{1,2})?$/.test(String(value)))throw new RangeError('Bitte einen nichtnegativen Dezimalwert mit höchstens zwei Nachkommastellen eingeben.');
 const parsed=decimal(value),v=fraction(parsed.units,power10(parsed.scale)),limit=decimal(max);
 if(compare(v,fraction(limit.units,power10(limit.scale)))>BigInt(0))throw new RangeError('Betrag ausserhalb des zulässigen Bereichs.');return v;
}
export function normalizeDiscount(input:unknown,currency:string):Discount{
 if(input===undefined)return {kind:'none'};
 if(!input||typeof input!=='object'||Array.isArray(input))throw new RangeError('Ungültiger Rabatt.');
 const r=input as Record<string,unknown>;
 if(r.kind==='none'){if(Object.keys(r).some(k=>k!=='kind'))throw new RangeError('Die Auswahl «Kein Rabatt» darf keinen Wert enthalten.');return {kind:'none'};}
 if(!['percent','fixed'].includes(String(r.kind))||Object.keys(r).some(k=>!['kind','value','currency'].includes(k))||(r.kind==='percent'&&r.currency!==undefined))throw new RangeError('Bitte genau eine Rabattart angeben.');
 const value=nonnegative(r.value,r.kind==='percent'?'100':'999999999.99');
 if(r.kind==='fixed'&&r.currency!==currency)throw new RangeError('Rabattwährung stimmt nicht mit der Dokumentwährung überein.');
 return r.kind==='percent'?{kind:'percent',value:amount(centsOf(value))}:{kind:'fixed',value:amount(centsOf(value)),currency};
}
function discountOn(base:Fraction,discount:Discount):Fraction{
 const value=discount.kind==='none'?zero:nonnegative(discount.value);
 const result=discount.kind==='percent'?times(base,divided(value,fraction(BigInt(100)))):value;
 if(compare(result,base)>BigInt(0))throw new RangeError('Der Rabatt übersteigt die rabattfähige Bemessungsgrundlage.');return result;
}
/** Stable largest-remainder display only. Exact bases never use allocated cents. */
function allocate(values:Fraction[],target:bigint,capacities?:bigint[]):bigint[]{
 const result=values.map((v,i)=>{const floor=v.n*BigInt(100)/v.d;return capacities&&floor>capacities[i]?capacities[i]:floor;});
 let rest=target-result.reduce((a,b)=>a+b,BigInt(0));
 const order=values.map((v,i)=>({i,remainder:fraction(v.n*BigInt(100)%v.d,v.d)})).sort((a,b)=>{const delta=compare(b.remainder,a.remainder);return delta===BigInt(0)?a.i-b.i:delta>BigInt(0)?1:-1;});
 while(rest>BigInt(0)){let changed=false;for(const {i} of order){if(rest===BigInt(0))break;if(capacities&&result[i]>=capacities[i])continue;result[i]++;rest--;changed=true;}if(!changed)throw new RangeError('Rundungsrest kann nicht verteilt werden.');}
 if(rest<BigInt(0))throw new RangeError('Ungültige Rundungszuteilung.');return result;
}
export function calculateDocument(lines:readonly {quantity:unknown;unit_price:unknown;vat_rate:unknown;discount?:unknown;tax_exempt?:unknown;price_base_quantity?:unknown}[],currency:string,discountInput?:unknown){
 if(!['CHF','EUR'].includes(currency)||!lines.length||lines.length>100)throw new RangeError('Ungültige Währung oder Positionsanzahl.');
 const discount=normalizeDiscount(discountInput,currency);
 const inputs=lines.map(line=>{const q=nonnegative(line.quantity,'1000000000'),p=nonnegative(line.unit_price),rate=nonnegative(line.vat_rate,'100');if(line.tax_exempt!==undefined&&typeof line.tax_exempt!=='boolean')throw new RangeError('Ungültige Steuerbefreiung.');if(line.tax_exempt&&rate.n!==BigInt(0))throw new RangeError('Steuerbefreite Positionen benötigen Steuersatz 0.');const priceBase=line.price_base_quantity??1;if(typeof priceBase!=='number'||!Number.isSafeInteger(priceBase)||priceBase<1||priceBase>1440)throw new RangeError('Ungültige Preisbasis.');const base=divided(times(q,p),fraction(BigInt(priceBase)));if(compare(base,nonnegative('999999999.99'))>BigInt(0))throw new RangeError('Positionsbetrag ausserhalb des zulässigen Bereichs.');return {base,rate,priceBase,discount:normalizeDiscount(line.discount,currency),exempt:line.tax_exempt===true};});
 const bases=inputs.map(l=>l.base),positionDiscounts=inputs.map(l=>discountOn(l.base,l.discount)),remaining=bases.map((b,i)=>minus(b,positionDiscounts[i]));
 const basis=sum(remaining),documentDiscount=discountOn(basis,discount),shares=remaining.map(b=>basis.n===BigInt(0)?zero:times(documentDiscount,divided(b,basis))),net=remaining.map((b,i)=>minus(b,shares[i]));
 const subtotal=centsOf(sum(net)),raw=centsOf(sum(bases)),afterPositions=centsOf(basis);
 const rawDisplay=allocate(bases,raw),positionDisplay=allocate(positionDiscounts,raw-afterPositions,rawDisplay),remainingDisplay=rawDisplay.map((b,i)=>b-positionDisplay[i]),documentDisplay=allocate(shares,afterPositions-subtotal,remainingDisplay);
 const groups: {key:string;rate:Fraction;exempt:boolean;basis:Fraction;indices:number[]}[]=[];
 inputs.forEach((line,i)=>{const key=String(line.rate.n)+'/'+line.rate.d+':'+line.exempt;let group=groups.find(g=>g.key===key);if(!group){group={key,rate:line.rate,exempt:line.exempt,basis:zero,indices:[]};groups.push(group);}group.basis=plus(group.basis,net[i]);group.indices.push(i);});
 const taxes=groups.map(g=>g.exempt?zero:times(g.basis,divided(g.rate,fraction(BigInt(100))))),vat=centsOf(sum(taxes));
 // Zero-rate/exempt groups have no fractional remainder and cannot receive a tax cent.
 const taxDisplay=allocate(taxes,vat,taxes.map(t=>t.n===BigInt(0)?BigInt(0):vat));
 if(subtotal+vat>BigInt('99999999999'))throw new RangeError('Dokumenttotal ausserhalb des zulässigen Bereichs.');
 return {revision:1,currency,discount,raw:amount(raw),basis:exact(basis),discountAmount:exact(documentDiscount),discountDisplay:amount(afterPositions-subtotal),discountRoundingCents:String(centsOf(documentDiscount)-(afterPositions-subtotal)),subtotal:amount(subtotal),vat:amount(vat),total:amount(subtotal+vat),
  positionDiscountDisplay:amount(raw-afterPositions),positionRoundingCents:String(centsOf(sum(positionDiscounts))-(raw-afterPositions)),
  lines:inputs.map((l,i)=>({position:i+1,...(l.priceBase!==1?{price_base_quantity:l.priceBase}:{}),discount:l.discount,tax_exempt:l.exempt,base:exact(l.base),positionDiscount:exact(positionDiscounts[i]),documentDiscount:exact(shares[i]),taxBasis:exact(net[i]),raw:amount(rawDisplay[i]),positionDiscountDisplay:amount(positionDisplay[i]),documentDiscountDisplay:amount(documentDisplay[i]),net:amount(remainingDisplay[i]-documentDisplay[i])})),
  taxGroups:groups.map((g,i)=>({rate:amount(centsOf(g.rate)),exempt:g.exempt,basis:exact(g.basis),net:amount(g.indices.reduce((s,j)=>s+remainingDisplay[j]-documentDisplay[j],BigInt(0))),tax:amount(taxDisplay[i])}))};
}

export type DocumentCalculation=ReturnType<typeof calculateDocument>;
export type BillingCalculationScope={id:string;positions:number[];calculation:DocumentCalculation};
/** Compose independently agreed documents. Each agreement keeps its exact engine
 * calculation and tax rounding; the invoice is their additive receivable, never
 * a re-priced copy of the agreements. Positions are one-based invoice positions. */
export function consolidateCalculations(scopes:readonly BillingCalculationScope[],currency:string){
 if(!['CHF','EUR'].includes(currency)||!scopes.length||scopes.length>100||new Set(scopes.map(s=>s.id)).size!==scopes.length)throw new RangeError('Ungültige Abrechnungszuordnung.');
 const positions=scopes.flatMap(s=>s.positions).sort((a,b)=>a-b);
 if(positions.length>100||positions.some((p,i)=>p!==i+1))throw new RangeError('Jede Position benötigt genau eine Abrechnungszuordnung.');
 for(const s of scopes)if(s.calculation.currency!==currency||s.positions.length!==s.calculation.lines.length)throw new RangeError('Ungültige Abrechnungszuordnung.');
 const total=(key:'raw'|'subtotal'|'vat'|'total'|'positionDiscountDisplay'|'discountDisplay')=>amount(scopes.reduce((n,s)=>n+BigInt(moneyMinor(s.calculation[key])),BigInt(0)));
 if(moneyMinor(total('total'))>99999999999)throw new RangeError('Dokumenttotal ausserhalb des zulässigen Bereichs.');
 const first=scopes[0].calculation;
 const adjustments=scopes.flatMap(s=>'settlementAdjustment' in s.calculation?[s.calculation.settlementAdjustment as {net:string;tax:string;kind?:string}]:[]);
 const exactSum=(key:'basis'|'discountAmount')=>exact(sum(scopes.map(s=>fraction(BigInt(s.calculation[key].numerator),BigInt(s.calculation[key].denominator)))));
 return {...first,...(adjustments.length?{settlementAdjustment:{...(adjustments.some(a=>a.kind==='cumulative')?{kind:'cumulative'}:{}),net:signedAmount(adjustments.reduce((n,a)=>n+BigInt(moneyMinor(a.net)),BigInt(0))),tax:signedAmount(adjustments.reduce((n,a)=>n+BigInt(moneyMinor(a.tax)),BigInt(0)))}}:{}),currency,discount:{kind:'none'} as Discount,basis:exactSum('basis'),discountAmount:exactSum('discountAmount'),raw:total('raw'),subtotal:total('subtotal'),vat:total('vat'),total:total('total'),positionDiscountDisplay:total('positionDiscountDisplay'),discountDisplay:total('discountDisplay'),
  positionRoundingCents:String(scopes.reduce((n,s)=>n+BigInt(s.calculation.positionRoundingCents),BigInt(0))),discountRoundingCents:String(scopes.reduce((n,s)=>n+BigInt(s.calculation.discountRoundingCents),BigInt(0))),
  lines:scopes.flatMap(s=>s.calculation.lines.map((l,i)=>({...l,position:s.positions[i],billing_agreement_id:s.id}))).sort((a,b)=>a.position-b.position),
  taxGroups:scopes.flatMap(s=>s.calculation.taxGroups.map(g=>({...g,billing_agreement_id:s.id}))),
  ...((scopes as readonly {calculation:DocumentCalculation&{serviceSubtotal?:string;serviceVat?:string;serviceTotal?:string;advanceApplications?:AdvanceApplication[]}}[]).some(s=>s.calculation.advanceApplications?.length)?{
   serviceSubtotal:amount(scopes.reduce((n,s)=>n+BigInt(moneyMinor((s.calculation as DocumentCalculation&{serviceSubtotal?:string}).serviceSubtotal??s.calculation.subtotal)),BigInt(0))),
   serviceVat:amount(scopes.reduce((n,s)=>n+BigInt(moneyMinor((s.calculation as DocumentCalculation&{serviceVat?:string}).serviceVat??s.calculation.vat)),BigInt(0))),
   serviceTotal:amount(scopes.reduce((n,s)=>n+BigInt(moneyMinor((s.calculation as DocumentCalculation&{serviceTotal?:string}).serviceTotal??s.calculation.total)),BigInt(0))),
   advanceApplications:scopes.flatMap(s=>(s.calculation as DocumentCalculation&{advanceApplications?:AdvanceApplication[]}).advanceApplications??[])
  }:{}),billingScopes:scopes.map(s=>({agreementId:s.id,positions:s.positions,calculation:s.calculation}))};
}

export type BillingScopeDiscount={agreementId:string;discount?:unknown};
export type BillingCalculationLine=Parameters<typeof calculateDocument>[0][number]&{billing_agreement_id?:unknown;billing_source_position?:unknown};
/** Visual row reordering must not move negotiated remainder cents between source
 * positions. Calculate in source order, then map the canonical lines back. */
export function calculateAgreedDocument(lines:readonly BillingCalculationLine[],currency:string,discount?:unknown):DocumentCalculation{
 if(!lines.every(l=>Number.isSafeInteger(l.billing_source_position)&&Number(l.billing_source_position)>0))return calculateDocument(lines,currency,discount);
 const order=lines.map((line,index)=>({line,index})).sort((a,b)=>Number(a.line.billing_source_position)-Number(b.line.billing_source_position)||a.index-b.index);
 const result=calculateDocument(order.map(l=>l.line),currency,discount);
 return {...result,lines:result.lines.map((line,i)=>({...line,position:order[i].index+1})).sort((a,b)=>a.position-b.position)};
}
export function calculateBillingDocument(lines:readonly BillingCalculationLine[],currency:string,discount?:unknown,scopes?:readonly BillingScopeDiscount[]){
 if(!scopes?.length)return calculateAgreedDocument(lines,currency,discount);
 if(normalizeDiscount(discount,currency).kind!=='none')throw new RangeError('Gesamtrabatte werden je Preisvereinbarung übernommen.');
 return consolidateCalculations(scopes.map(s=>{const positions=lines.flatMap((l,i)=>l.billing_agreement_id===s.agreementId?[i+1]:[]);return {id:s.agreementId,positions,calculation:calculateAgreedDocument(positions.map(p=>lines[p-1]),currency,s.discount)};}),currency);
}

export type AdvanceTaxAmount={rate:string;exempt:boolean;net:string;tax:string};
const taxKey=(group:{rate:unknown;exempt:unknown})=>String(moneyMinor(group.rate))+':'+Boolean(group.exempt);
/** Allocate an existing receivable, not a new price. Cumulative allocation keeps
 * the original VAT cents recoverable even after many small applications. */
export function allocateAdvance(calculation:DocumentCalculation,value:unknown,prior:readonly AdvanceTaxAmount[][]=[]):AdvanceTaxAmount[]{
 nonnegative(value);const requested=moneyMinor(value);if(requested<=0)throw new RangeError('Bitte einen positiven Anrechnungsbetrag angeben.');
 const groups=calculation.taxGroups;
 if(new Set(groups.map(taxKey)).size!==groups.length)throw new RangeError('Akonto-Steuergruppen sind nicht eindeutig.');
 const facts=groups.map(g=>{const used=prior.flat().filter(p=>taxKey(p)===taxKey(g));const net=BigInt(moneyMinor(g.net)),tax=BigInt(moneyMinor(g.tax)),usedNet=used.reduce((n,p)=>n+BigInt(moneyMinor(p.net)),BigInt(0)),usedTax=used.reduce((n,p)=>n+BigInt(moneyMinor(p.tax)),BigInt(0));if(usedNet<0||usedTax<0||usedNet>net||usedTax>tax)throw new RangeError('Akonto-Anrechnung ist inkonsistent.');return {g,net,tax,usedNet,usedTax,remaining:net+tax-usedNet-usedTax};});
 const remaining=facts.reduce((n,g)=>n+g.remaining,BigInt(0));
 if(BigInt(requested)>remaining)throw new RangeError('Der Akontobetrag wurde bereits angerechnet.');
 const shares=allocate(facts.map(g=>fraction(g.remaining*BigInt(requested),remaining*BigInt(100))),BigInt(requested),facts.map(g=>g.remaining));
 return facts.flatMap((f,i)=>{if(!shares[i])return [];const cumulative=f.usedNet+f.usedTax+shares[i],net=centsOf(fraction(f.net*cumulative,(f.net+f.tax)*BigInt(100)))-f.usedNet,tax=shares[i]-net;if(net<0||tax<0||net>f.net-f.usedNet||tax>f.tax-f.usedTax)throw new RangeError('Akonto-Rundung ist inkonsistent.');return [{rate:f.g.rate,exempt:f.g.exempt,net:amount(net),tax:amount(tax)}];});
}

export type AdvanceApplication={agreementLabel?:string;advanceNumber?:string;advanceInvoiceId:string;agreementId:string;amount:string;taxGroups:AdvanceTaxAmount[]};
/** Reduce the current claim by traceable, previously invoiced tax amounts.
 * Payment receipts are not moved and historical calculations are never changed. */
export function applyAdvanceApplications(calculation:DocumentCalculation,applications:readonly AdvanceApplication[]){
 if(!applications.length)return calculation;
 if(new Set(applications.map(a=>a.advanceInvoiceId+':'+a.agreementId)).size!==applications.length)throw new RangeError('Ein Akonto kann pro Rechnung nur einmal angerechnet werden.');
 const amounts=applications.flatMap(a=>a.taxGroups);
 for(const a of applications)if(moneyMinor(a.amount)<=0||moneyMinor(a.amount)!==a.taxGroups.reduce((n,g)=>n+moneyMinor(g.net)+moneyMinor(g.tax),0))throw new RangeError('Akonto-Anrechnung ist inkonsistent.');
 const taxGroups=calculation.taxGroups.map(g=>{const relevant=amounts.filter(a=>taxKey(a)===taxKey(g));const net=BigInt(moneyMinor(g.net))-relevant.reduce((n,a)=>n+BigInt(moneyMinor(a.net)),BigInt(0)),tax=BigInt(moneyMinor(g.tax))-relevant.reduce((n,a)=>n+BigInt(moneyMinor(a.tax)),BigInt(0));if(net<0||tax<0)throw new RangeError('Akonto übersteigt die Leistung dieser Steuergruppe.');return {...g,net:amount(net),tax:amount(tax)};});
 if(amounts.some(a=>!calculation.taxGroups.some(g=>taxKey(g)===taxKey(a))))throw new RangeError('Akonto und Leistung benötigen übereinstimmende Steuergruppen.');
 const net=taxGroups.reduce((n,g)=>n+BigInt(moneyMinor(g.net)),BigInt(0)),tax=taxGroups.reduce((n,g)=>n+BigInt(moneyMinor(g.tax)),BigInt(0));
 return {...calculation,serviceSubtotal:calculation.subtotal,serviceVat:calculation.vat,serviceTotal:calculation.total,serviceTaxGroups:calculation.taxGroups,subtotal:amount(net),vat:amount(tax),total:amount(net+tax),taxGroups,advanceApplications:[...applications]};
}

export type PriorBillingCalculation={calculation:DocumentCalculation&{serviceTaxGroups?:DocumentCalculation['taxGroups']};sourcePositions:number[];quantities?:unknown[]};
/** Final cent reconciliation against an immutable agreed calculation. Prices,
 * quantities and discounts still pass through calculateDocument. Only bounded
 * rounding residues are reconciled; a pricing/discount mismatch requires review. */
export function reconcileFinalCalculation(current:DocumentCalculation,agreed:DocumentCalculation,sourcePositions:number[],prior:readonly PriorBillingCalculation[]){
 if(current.currency!==agreed.currency||sourcePositions.length!==current.lines.length)throw new RangeError('Schlussrechnungszuordnung ist ungültig.');
 const presentSources=new Set(sourcePositions),presentTaxes=new Set(current.taxGroups.map(taxKey));
 for(const [index,original] of agreed.lines.entries())if(!presentSources.has(index+1)){
  const previous=prior.flatMap(p=>p.calculation.lines.filter((_,n)=>p.sourcePositions[n]===index+1));
  if(BigInt(moneyMinor(original.net))!==previous.reduce((n,l)=>n+BigInt(moneyMinor(l.net)),BigInt(0)))throw new RangeError('Angebotsposition fehlt.');
 }
 for(const original of agreed.taxGroups)if(!presentTaxes.has(taxKey(original))){
  const previous=prior.flatMap(p=>p.calculation.serviceTaxGroups??p.calculation.taxGroups).filter(g=>taxKey(g)===taxKey(original));
  if(BigInt(moneyMinor(original.net))!==previous.reduce((n,g)=>n+BigInt(moneyMinor(g.net)),BigInt(0))||BigInt(moneyMinor(original.tax))!==previous.reduce((n,g)=>n+BigInt(moneyMinor(g.tax)),BigInt(0)))throw new RangeError('Schlussrechnung benötigt alle verbleibenden Steuergruppen.');
 }
 const limit=BigInt(prior.length+1);
 const bounded=(expected:bigint,actual:unknown)=>{const delta=expected-BigInt(moneyMinor(actual));if(expected<0||delta>limit||delta< -limit)throw new RangeError('Preis- oder Rabattabweichung vor der Schlussrechnung prüfen.');return delta;};
 const reconciled=new Map<number,bigint>();
 for(const source of new Set(sourcePositions)){
  const original=agreed.lines[source-1];if(!original)throw new RangeError('Angebotsposition fehlt.');
  const indices=sourcePositions.flatMap((p,i)=>p===source?[i]:[]),previous=prior.flatMap(p=>p.calculation.lines.filter((_,n)=>p.sourcePositions[n]===source));
  const remaining=BigInt(moneyMinor(original.net))-previous.reduce((n,l)=>n+BigInt(moneyMinor(l.net)),BigInt(0));
  bounded(remaining,amount(indices.reduce((n,i)=>n+BigInt(moneyMinor(current.lines[i].net)),BigInt(0))));
  const allocated=allocate(indices.map(i=>fraction(BigInt(moneyMinor(current.lines[i].net)),BigInt(100))),remaining);
  indices.forEach((index,n)=>reconciled.set(index,allocated[n]));
 }
 const lines=current.lines.map((line,i)=>{const remaining=reconciled.get(i)!;return {...line,net:amount(remaining),settlementAdjustmentCents:String(remaining-BigInt(moneyMinor(line.net)))};});
 const taxGroups=current.taxGroups.map(group=>{const original=agreed.taxGroups.find(g=>taxKey(g)===taxKey(group));if(!original)throw new RangeError('Steuergruppe der Schlussrechnung fehlt.');const previous=prior.flatMap(p=>p.calculation.serviceTaxGroups??p.calculation.taxGroups).filter(g=>taxKey(g)===taxKey(group));const net=BigInt(moneyMinor(original.net))-previous.reduce((n,g)=>n+BigInt(moneyMinor(g.net)),BigInt(0)),tax=BigInt(moneyMinor(original.tax))-previous.reduce((n,g)=>n+BigInt(moneyMinor(g.tax)),BigInt(0));bounded(net,group.net);bounded(tax,group.tax);return {...group,net:amount(net),tax:amount(tax)};});
 const net=lines.reduce((n,l)=>n+BigInt(moneyMinor(l.net)),BigInt(0)),groupNet=taxGroups.reduce((n,g)=>n+BigInt(moneyMinor(g.net)),BigInt(0)),tax=taxGroups.reduce((n,g)=>n+BigInt(moneyMinor(g.tax)),BigInt(0));
 if(net!==groupNet)throw new RangeError('Schlussrechnung benötigt alle verbleibenden Steuergruppen.');
 return {...current,lines,taxGroups,subtotal:amount(net),vat:amount(tax),total:amount(net+tax),settlementAdjustment:{net:signedAmount(net-BigInt(moneyMinor(current.subtotal))),tax:signedAmount(tax-BigInt(moneyMinor(current.vat)))}};
}

const signedAmount=(cents:bigint)=>cents<BigInt(0)?'-'+amount(-cents):amount(cents);

/** Recalculate delivered quantities once with the existing engine, then subtract
 * the actual historical cents. Explicit fixed-discount portions remain explicit;
 * their cumulative values are capped separately against the agreed snapshot. */
export function reconcileCumulativeQuantityCalculation(current:DocumentCalculation,items:readonly Parameters<typeof calculateDocument>[0][number][],agreed:DocumentCalculation,sourcePositions:number[],currentQuantities:unknown[],prior:readonly PriorBillingCalculation[]){
 if(items.length!==agreed.lines.length||currentQuantities.length!==sourcePositions.length)throw new RangeError('Schlussrechnungszuordnung ist ungültig.');
 const cumulative=items.map((item,index)=>{
  let quantity=BigInt(0),fixed=BigInt(0);
  const addLine=(position:number,q:unknown,line:DocumentCalculation['lines'][number])=>{if(position!==index+1)return;quantity+=BigInt(moneyMinor(q));if(line.discount.kind==='fixed')fixed+=BigInt(moneyMinor(line.discount.value));};
  for(const p of prior){if(p.quantities?.length!==p.sourcePositions.length)throw new RangeError('Schlussrechnungszuordnung ist ungültig.');p.calculation.lines.forEach((line,n)=>addLine(p.sourcePositions[n],p.quantities![n],line));}
  current.lines.forEach((line,n)=>addLine(sourcePositions[n],currentQuantities[n],line));
  const discount=agreed.lines[index].discount;
  return {...item,quantity:amount(quantity),discount:discount.kind==='fixed'?{kind:'fixed' as const,value:amount(fixed),currency:current.currency}:discount,tax_exempt:agreed.lines[index].tax_exempt};
 });
 const header=agreed.discount.kind==='fixed'?{kind:'fixed' as const,value:amount(prior.reduce((n,p)=>n+BigInt(p.calculation.discount.kind==='fixed'?moneyMinor(p.calculation.discount.value):0),BigInt(current.discount.kind==='fixed'?moneyMinor(current.discount.value):0))),currency:current.currency}:agreed.discount;
 const target=calculateDocument(cumulative,current.currency,header);
 const result=reconcileFinalCalculation(current,target,sourcePositions,prior);
 return {...result,settlementAdjustment:{...result.settlementAdjustment,kind:'cumulative' as const}};
}
