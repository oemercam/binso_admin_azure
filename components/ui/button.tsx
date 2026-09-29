import type {ButtonHTMLAttributes, ReactNode} from "react";

type Variant="primary"|"secondary"|"ghost"|"danger";
type Size="sm"|"md"|"lg";

export type ButtonProps=ButtonHTMLAttributes<HTMLButtonElement>&{
  variant?:Variant;
  size?:Size;
  fullWidth?:boolean;
  loading?:boolean;
  icon?:ReactNode;
};

export function Button({variant="primary",size="md",fullWidth=false,loading=false,icon,children,className="",disabled,...props}:ButtonProps){
  return <button className={`ui-button ui-button-${variant} ui-button-${size}${fullWidth?" is-full":""} ${className}`.trim()} disabled={disabled||loading} aria-busy={loading||undefined} {...props}>
    {loading?<span className="ui-button-spinner" aria-hidden="true"/>:icon}
    <span className="ui-button-label">{children}</span>
  </button>;
}
