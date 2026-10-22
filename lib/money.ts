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
 const inputs=lines.map(line=>{const q=nonnegative(line.quantity,'1000000000'),p=nonnegative(line.unit_price),rate=nonnegative(line.vat_rate,'100');if(line.tax_exempt!==undefined&&typeof line.tax_exempt!=='boolean')throw new RangeError('Ungültige Steuerbefreiung.');if(line.tax_exempt&&rate.n!==BigInt(0))throw new RangeError('Steuerbefreite Positionen benötigen Steuersatz 0.');const priceBase=line.price_base_quantity??1;if(priceBase!==1&&priceBase!==60)throw new RangeError('Ungültige Preisbasis.');const base=divided(times(q,p),fraction(BigInt(priceBase)));if(compare(base,nonnegative('999999999.99'))>BigInt(0))throw new RangeError('Positionsbetrag ausserhalb des zulässigen Bereichs.');return {base,rate,priceBase,discount:normalizeDiscount(line.discount,currency),exempt:line.tax_exempt===true};});
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
  lines:inputs.map((l,i)=>({position:i+1,...(l.priceBase===60?{price_base_quantity:60}:{}),discount:l.discount,tax_exempt:l.exempt,base:exact(l.base),positionDiscount:exact(positionDiscounts[i]),documentDiscount:exact(shares[i]),taxBasis:exact(net[i]),raw:amount(rawDisplay[i]),positionDiscountDisplay:amount(positionDisplay[i]),documentDiscountDisplay:amount(documentDisplay[i]),net:amount(remainingDisplay[i]-documentDisplay[i])})),
  taxGroups:groups.map((g,i)=>({rate:amount(centsOf(g.rate)),exempt:g.exempt,basis:exact(g.basis),net:amount(g.indices.reduce((s,j)=>s+remainingDisplay[j]-documentDisplay[j],BigInt(0))),tax:amount(taxDisplay[i])}))};
}
