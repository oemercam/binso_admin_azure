"use client";

import {type ReactNode} from "react";

/** Both portals use the same opaque header and translucent action surface. */
export function AppHeader({leading,actions,children,detail=false,className="",actionClassName="",leadingClassName=""}:{leading:ReactNode;actions?:ReactNode;children?:ReactNode;detail?:boolean;className?:string;actionClassName?:string;leadingClassName?:string}){
 return <header className={`app-header ${className}`.trim()} data-detail={detail||undefined}>
  <div className={`app-header-leading ${leadingClassName}`.trim()}>{leading}</div>
  {children}
  {actions&&<div className={`app-header-actions app-glass ${actionClassName}`.trim()}>{actions}</div>}
 </header>;
}

/** Navigation owns destinations only; creation belongs to the page action area. */
export function MobileDock({children,compact=false}:{children:ReactNode;compact?:boolean}){
 return <div className={`mobile-dock${compact?" is-compact":""}`}>
  {children}
 </div>;
}
