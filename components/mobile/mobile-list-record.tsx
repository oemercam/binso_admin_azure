import {ChevronRight} from "lucide-react";

export function normalizeMobileRecordValue(value:unknown){return String(value??"").trim().replace(/\s+/g," ").toLocaleLowerCase()}
export function mobileRecordSubtitle(title:string,values:Array<string|undefined|null>){
 const normalizedTitle=normalizeMobileRecordValue(title);
 const seen=new Set<string>();
 return values.filter((value):value is string=>Boolean(value&&String(value).trim()&&value!=="–")).filter(value=>{
  const normalized=normalizeMobileRecordValue(value);
  if(!normalized||normalized===normalizedTitle||seen.has(normalized))return false;
  seen.add(normalized);return true;
 }).join(" · ");
}

export function MobileRecordSecondary({title,values}:{title:string;values:Array<string|undefined|null>}){const subtitle=mobileRecordSubtitle(title,values);return subtitle?<p className="record-card-mobile-summary"><span>{subtitle}</span></p>:null}

export function MobileRecordSummary({title,subtitle,status,statusClass}:{title:string;subtitle?:string;status:string;statusClass:string}){
 const safeSubtitle=mobileRecordSubtitle(title,[subtitle]);
 return <><span className="mobile-record-primary">{title}</span>{safeSubtitle&&<span className="mobile-record-secondary">{safeSubtitle}</span>}<span className={`mobile-record-status ${statusClass}`}>{status}</span><ChevronRight className="record-chevron" size={16} aria-hidden="true"/></>;
}
