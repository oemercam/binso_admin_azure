import type {InputHTMLAttributes,TextareaHTMLAttributes,SelectHTMLAttributes,ReactNode} from "react";

type FieldProps={label:string;help?:string;error?:string;required?:boolean;children:ReactNode;htmlFor?:string};
export function Field({label,help,error,required,children,htmlFor}:FieldProps){return <label className={`ui-field${error?" has-error":""}`} htmlFor={htmlFor}><span className="ui-field-label">{label}{required&&<span aria-hidden="true"> *</span>}</span>{children}{error?<span className="ui-field-error" role="alert">{error}</span>:help?<span className="ui-field-help">{help}</span>:null}</label>}
export function Input({className="",...props}:InputHTMLAttributes<HTMLInputElement>){return <input className={`ui-input ${className}`.trim()} {...props}/>}
export function Textarea({className="",...props}:TextareaHTMLAttributes<HTMLTextAreaElement>){return <textarea className={`ui-textarea ${className}`.trim()} {...props}/>}
export function Select({className="",children,...props}:SelectHTMLAttributes<HTMLSelectElement>&{children:ReactNode}){return <select className={`ui-select ${className}`.trim()} {...props}>{children}</select>}
export function Checkbox({label,className="",...props}:InputHTMLAttributes<HTMLInputElement>&{label:ReactNode}){return <label className={`ui-checkbox-row ${className}`.trim()}><input type="checkbox" {...props}/><span>{label}</span></label>}
