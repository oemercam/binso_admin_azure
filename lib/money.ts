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
