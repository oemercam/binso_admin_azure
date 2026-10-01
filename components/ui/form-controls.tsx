import {forwardRef,type InputHTMLAttributes,type TextareaHTMLAttributes,type SelectHTMLAttributes,type ReactNode} from "react";

type FieldProps={label:string;help?:string;error?:string;required?:boolean;children:ReactNode;htmlFor?:string};
export function Field({label,help,error,required,children,htmlFor}:FieldProps){return <label className={`ui-field${error?" has-error":""}`} htmlFor={htmlFor}><span className="ui-field-label">{label}{required&&<span aria-hidden="true"> *</span>}</span>{children}{error?<span className="ui-field-error" role="alert">{error}</span>:help?<span className="ui-field-help">{help}</span>:null}</label>}
export const Input=forwardRef<HTMLInputElement,InputHTMLAttributes<HTMLInputElement>>(function Input({className="",...props},ref){return <input ref={ref} className={`ui-input ${className}`.trim()} {...props}/>});
export function Textarea({className="",...props}:TextareaHTMLAttributes<HTMLTextAreaElement>){return <textarea className={`ui-textarea ${className}`.trim()} {...props}/>}
export function Select({className="",children,...props}:SelectHTMLAttributes<HTMLSelectElement>&{children:ReactNode}){return <select className={`ui-select ${className}`.trim()} {...props}>{children}</select>}
export function Checkbox({label,className="",...props}:InputHTMLAttributes<HTMLInputElement>&{label:ReactNode}){return <label className={`ui-checkbox-row ${className}`.trim()}><input type="checkbox" {...props}/><span>{label}</span></label>}

/** Canonical semantic form primitives. They deliberately stay thin so validation,
 * permissions and persistence remain owned by the feature using them. */
export const DateInput=forwardRef<HTMLInputElement,Omit<InputHTMLAttributes<HTMLInputElement>,"type">>(function DateInput(props,ref){return <Input ref={ref} type="date" inputMode="numeric" {...props}/>});
export const TimeInput=forwardRef<HTMLInputElement,Omit<InputHTMLAttributes<HTMLInputElement>,"type">>(function TimeInput(props,ref){return <Input ref={ref} type="time" inputMode="numeric" {...props}/>});
export const NumberInput=forwardRef<HTMLInputElement,Omit<InputHTMLAttributes<HTMLInputElement>,"type">>(function NumberInput(props,ref){return <Input ref={ref} type="number" inputMode="decimal" {...props}/>});
export const CurrencyInput=forwardRef<HTMLInputElement,Omit<InputHTMLAttributes<HTMLInputElement>,"type"|"inputMode">>(function CurrencyInput(props,ref){return <Input ref={ref} type="number" inputMode="decimal" step={props.step??"0.05"} {...props}/>});
export function FormSection({title,description,children,className=""}:{title?:ReactNode;description?:ReactNode;children:ReactNode;className?:string}){return <section className={`ui-form-section ${className}`.trim()}>{(title||description)&&<header className="ui-form-section-header">{title&&<h2>{title}</h2>}{description&&<p>{description}</p>}</header>}<div className="ui-form-section-body">{children}</div></section>}
export function FormStep({active,index,title,children}:{active:boolean;index:number;title:ReactNode;children:ReactNode}){return <section className={`ui-form-step${active?" is-active":""}`} data-form-step={index} aria-hidden={!active}><header className="ui-form-step-header"><span>{index}</span><h2>{title}</h2></header>{children}</section>}
export function FormActions({children,className=""}:{children:ReactNode;className?:string}){return <div className={`ui-form-actions ${className}`.trim()}>{children}</div>}
