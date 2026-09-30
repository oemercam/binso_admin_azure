import Link, {type LinkProps} from "next/link";
import type {AnchorHTMLAttributes,ReactNode} from "react";

type Variant="primary"|"secondary"|"ghost"|"danger";
type Size="sm"|"md"|"lg";
type Props=LinkProps&Omit<AnchorHTMLAttributes<HTMLAnchorElement>,keyof LinkProps|"href">&{
 children:ReactNode;variant?:Variant;size?:Size;fullWidth?:boolean;icon?:ReactNode;
};

export function ButtonLink({children,variant="primary",size="md",fullWidth=false,icon,className="",...props}:Props){
 return <Link className={`ui-button ui-button-${variant} ui-button-${size}${fullWidth?" is-full":""} ${className}`.trim()} {...props}>{icon}<span className="ui-button-label">{children}</span></Link>;
}
