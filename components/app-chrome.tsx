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

/** Creation is a separate action next to navigation, never a destination. */
export function MobileDock({children,action,compact=false}:{children:ReactNode;action?:ReactNode;compact?:boolean}){
 return <div className={`mobile-dock${compact?" is-compact":""}`}>
  {children}
  {action&&<div className="mobile-dock-action">{action}</div>}
 </div>;
}
