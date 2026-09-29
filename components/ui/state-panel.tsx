import type {ReactNode} from "react";
type Kind="empty"|"error"|"offline"|"permission"|"loading";
export function StatePanel({kind,title,text,action}:{kind:Kind;title:string;text?:string;action?:ReactNode}){return <div className={`ui-state ui-state-${kind}`} role={kind==="error"?"alert":undefined}><div className="ui-state-icon" aria-hidden="true"/ ><strong>{title}</strong>{text&&<p>{text}</p>}{action&&<div className="ui-state-action">{action}</div>}</div>}
