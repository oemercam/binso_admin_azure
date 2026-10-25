"use client";

import {LocalizedText,LocalizedElement,useLocale} from "@/lib/client/locale";
import {mainNavigation,moreNavigation} from '@/config/workspace-navigation';
import {localeTags} from '@/lib/locales/config';
import {formControlSnapshot} from '@/lib/client/form-snapshot';
import { Children, Fragment, isValidElement, cloneElement, useState, useRef, useEffect, useLayoutEffect, useContext, useId, type ReactNode, type CSSProperties } from "react";
import type {MetricTrend} from '@/lib/kpi-trend';
import {HeaderPanel} from './header-panel';
import {WorkspaceActionContext} from '@/lib/client/workspace-actions';
import Link from "next/link";
import {SlidersHorizontal} from "lucide-react";
import {useRouter} from "next/navigation";
import { createPortal } from "react-dom";
import { useDialogFocus } from "./use-dialog-focus";
import { Button, Icon, Metric, Status, FormActions } from "@/components/ui";
import { usePageAccess } from "@/lib/client/page-access";
import {useBrowserBackGuard,allowDraftNavigation} from "./use-browser-back-guard";
import ConfirmDialog from "./confirm-dialog";
import {createActions,permittedCreateActions,createReturnHref} from "@/config/create-actions";

// Reuse existing destination icons, including modules reached through settings.
const informationDestinations=[...mainNavigation,...moreNavigation.flatMap<{href:string;icon:string}>(group=>group.items),...createActions.map(item=>({href:item.href.replace(/\/neu$/,''),icon:item.icon}))];

/** Action rows have one DOM shape; navigation and destructive intent are explicit. */
export function ActionRow({title,verbatim=false,icon,href,onClick,disabled=false,requiresWrite=false,danger=false,navigation=false,current=false,description,metadata,value,endAdornment,selected,role,tabIndex,onKeyDown}: {
 title:string;verbatim?:boolean;icon:ReactNode;href?:string;onClick?:()=>void;disabled?:boolean;requiresWrite?:boolean;danger?:boolean;navigation?:boolean;current?:boolean;description?:string;metadata?:string;value?:ReactNode;endAdornment?:ReactNode;selected?:boolean;role?:"radio";tabIndex?:number;onKeyDown?:React.KeyboardEventHandler<HTMLButtonElement>;
}) {
 const access=usePageAccess();
 if(href&&!access.canOpen(href))return null;
 const blocked=disabled||(requiresWrite&&!access.write);
 const className=`action-row${danger?" action-row-danger":""}`;
 const body=<>{typeof icon==='string'?<Icon name={icon} size={18}/>:icon}<span className="action-row-label">{description||metadata?<span><LocalizedText verbatim={verbatim}>{title}</LocalizedText></span>:<LocalizedText verbatim={verbatim}>{title}</LocalizedText>}{description&&<small className="action-row-description"><LocalizedText verbatim={verbatim}>{description}</LocalizedText></small>}{metadata&&<small className="action-row-description">{metadata}</small>}</span>{value!==undefined&&<span className="action-row-value">{value}</span>}{endAdornment??(selected!==undefined?<span className="action-row-selection" aria-hidden="true">{selected&&role!=="radio"&&<Icon name="check" size={16}/>}</span>:!danger&&(navigation||href)&&<Icon name="arrow" size={16}/>)}</>;
 return href&&!blocked?<Link prefetch={href.startsWith("/api/")?false:undefined} href={href} onClick={onClick} className={className} aria-current={current?"page":undefined}>{body}</Link>:<button type="button" className={className} disabled={blocked} onClick={onClick} role={role} aria-checked={role==="radio"?selected:undefined} tabIndex={tabIndex} onKeyDown={onKeyDown}>{body}</button>;
}

/** Compact single selection extends the action-row contract, including keyboard navigation. */
export function SelectionRows<T extends string>({label,value,options,onChange}:{label:string;value:T;options:readonly {value:T;title:string;description:string;icon:ReactNode}[];onChange:(value:T)=>void}){
 return <LocalizedElement as="div" className="action-list selection-rows" role="radiogroup" aria-label={label}>{options.map((option,index)=><ActionRow key={option.value} title={option.title} description={option.description} icon={option.icon} role="radio" selected={value===option.value} tabIndex={value===option.value?0:-1} onClick={()=>onChange(option.value)} onKeyDown={event=>{
  const next=event.key==='Home'?0:event.key==='End'?options.length-1:['ArrowDown','ArrowRight'].includes(event.key)?(index+1)%options.length:['ArrowUp','ArrowLeft'].includes(event.key)?(index+options.length-1)%options.length:null;
  if(next===null)return;event.preventDefault();onChange(options[next].value);(event.currentTarget.parentElement?.children[next] as HTMLElement|undefined)?.focus();
 }}/>)}</LocalizedElement>;
}

/** Shared visual contract for Binso One. Navigation, creation and entity actions have separate shared owners. */
export function PageHeading({ title, description, action, leading, verbatimTitle=false }: { title: string;verbatimTitle?:boolean; description?: string; action?: ReactNode; leading?: ReactNode }) {
  return <header className="bo-page-heading">{leading}
    <div className="bo-page-heading-main"><h1><LocalizedText verbatim={verbatimTitle}>{title}</LocalizedText></h1>{action}</div>
    {description && <p><LocalizedText verbatim={verbatimTitle}>{description}</LocalizedText></p>}
  </header>;
}

export function CreateAction({ label, href, onClick, disabled = false, requiresWrite = true }: { label: string; href?: string; onClick?: () => void; disabled?: boolean;requiresWrite?:boolean }) {
  return <Button href={href} requiresWrite={requiresWrite} className="bo-create-action" ariaLabel={label} disabled={disabled} onClick={onClick} icon="plus"><span className="create-action-label"><LocalizedText>{label}</LocalizedText></span><span className="create-action-short" aria-hidden="true"><LocalizedText>{"Neu"}</LocalizedText></span></Button>;
}

/** One context-action contract: desktop command bar, mobile overflow sheet. */
export function ContextActions({label="Weitere Aktionen",children,mobile=true}:{label?:string;children:ReactNode;mobile?:boolean}){
 const register=useContext(WorkspaceActionContext),id=useId(),[open,setOpen]=useState(false);
 useLayoutEffect(()=>{register?.(id,children);return()=>register?.(id,null)},[register,id,children]);
 return <>{mobile&&<div className="context-actions-mobile"><Button variant="ghost" icon="more" ariaLabel={label} onClick={()=>setOpen(true)}><LocalizedText>{label}</LocalizedText></Button></div>}{!register&&<div className="context-actions-inline">{children}</div>}{mobile&&<ActionSheet label={label} open={open} onClose={()=>setOpen(false)}><div className="context-actions-menu" onClick={event=>{if(event.target instanceof Element&&event.target.closest('a,button'))setOpen(false)}}>{children}</div></ActionSheet>}</>;
}

export function QuickCreateAction({section="dashboard",returnTo="/dashboard"}:{section?:string;returnTo?:string}){
 const access=usePageAccess(),[open,setOpen]=useState(false);
 const actions=permittedCreateActions(section,access.canOpen);
 if(!actions.length)return null;
 // The catalog authorizes each target, including support in a read-only tenant.
 if(actions.length===1)return <CreateAction requiresWrite={false} label={actions[0].title} href={createReturnHref(actions[0].href,returnTo)}/>;
 return <><CreateAction requiresWrite={false} label="Neu erstellen" onClick={()=>setOpen(true)}/>
  <ActionSheet label="Neu erstellen" className="quick-create-sheet" open={open} onClose={()=>setOpen(false)}><div className="action-list">{actions.map(item=><ActionRow key={item.href} title={item.title} icon={item.icon} href={createReturnHref(item.href,returnTo)} navigation onClick={()=>setOpen(false)}/>)}</div></ActionSheet>
 </>;
}

export function DetailHeading({ title, status, tone = "neutral", subtitle, leading, action, mobileAction, recordLabel, statusPlacement="title", verbatimTitle=false }: {
  title: string;verbatimTitle?:boolean; status?: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info"; subtitle?: string; leading?: ReactNode; action?: ReactNode;mobileAction?:ReactNode;recordLabel?:string;statusPlacement?:"title"|"subtitle";
}) {
  return <div className="bo-detail-heading">{leading}{recordLabel&&<small className="bo-record-label">{recordLabel}</small>}
    <div className="bo-detail-heading-main"><h1><LocalizedText verbatim={verbatimTitle}>{title}</LocalizedText></h1>{statusPlacement==="title"&&status != null && <Status tone={tone}>{status}</Status>}{mobileAction&&<div className="mobile-page-actions">{mobileAction}</div>}{action&&<div className="bo-detail-commandbar">{action}</div>}</div>
    {(subtitle||statusPlacement==="subtitle"&&status!=null)&&<p className="bo-detail-meta">{subtitle&&<LocalizedText verbatim={verbatimTitle}>{subtitle}</LocalizedText>}{!subtitle&&statusPlacement==="subtitle"&&status!=null&&<span><LocalizedText>{"Status"}</LocalizedText></span>}{statusPlacement==="subtitle"&&status!=null&&<Status appearance="pill" tone={tone}>{status}</Status>}</p>}
  </div>;
}

/** Responsive dossier slots keep contact facts before records on a phone. */
export function DetailSections({summary,facts,records,extra}:{summary:ReactNode;facts:ReactNode;records:ReactNode;extra?:ReactNode}){
 return <div className="detail-grid" data-layout="dossier" data-has-extra={!!extra||undefined}><section data-area="summary">{summary}</section><aside data-area="context"><section data-area="facts">{facts}</section>{extra&&<section data-area="extra">{extra}</section>}</aside><section data-area="records">{records}</section></div>;
}

/** Supplementary facts stay accessible without crowding a mobile dossier. */
export function DetailDisclosure({label,children,open:controlledOpen,defaultOpen,onOpenChange,summaryValue}:{label:string;children:ReactNode;open?:boolean;defaultOpen?:boolean;onOpenChange?:(open:boolean)=>void;summaryValue?:ReactNode}){
 const [localOpen,setOpen]=useState(defaultOpen??false),touched=useRef(false),open=controlledOpen??localOpen;
 useLayoutEffect(()=>{if(controlledOpen!==undefined||defaultOpen!==undefined)return;const media=window.matchMedia('(min-width:761px)'),update=()=>{if(!touched.current)setOpen(media.matches)};update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[controlledOpen,defaultOpen]);
 return <details className="bo-data-disclosure" data-controlled={controlledOpen!==undefined||undefined} open={open} onToggle={event=>{const next=event.currentTarget.open;if(next!==open){touched.current=true;if(controlledOpen===undefined)setOpen(next);onOpenChange?.(next)}}}><summary><LocalizedText>{label}</LocalizedText>{summaryValue!==undefined&&<span className="bo-disclosure-value">{summaryValue}</span>}</summary><div>{children}</div></details>;
}

export function MetricTiles({ children, columns=4, desktopOnly=false }: { children: ReactNode;columns?:2|3|4;desktopOnly?:boolean }) {
  return <div className="metrics-grid bo-metric-tiles" data-desktop-only={desktopOnly||undefined} style={{"--metric-columns":columns} as CSSProperties}>{children}</div>;
}

export function MetricTile({ label, value, hint, currency, icon, trend,compactMoney=false }: { label: ReactNode; value: ReactNode; hint?:string; currency?:string; compactMoney?:boolean; icon?:string;trend?:MetricTrend }) {
  const {locale}=useLocale();
  const full=typeof value==='number'?value.toLocaleString(localeTags[locale],{minimumFractionDigits:2,maximumFractionDigits:2}):'';
  const amount=compactMoney&&full.length>12&&typeof value==='number'?value.toLocaleString(localeTags[locale],{notation:'compact',maximumFractionDigits:2}):full;
  return <Metric trend={trend} icon={icon} label={label} value={currency&&typeof value==='number'?<span className="metric-money" title={currency+" "+full} aria-label={currency+" "+full}><span className="metric-money-currency">{currency}</span>{" "}<span>{amount}</span></span>:value} hint={hint}/>;
}

/** Workspace sections share the customer-detail card and row boundary contract. */
export function WorkspaceSection({children,className=""}:{children:ReactNode;className?:string}){
 return <section className={`bo-workspace-section ${className}`.trim()}>{children}</section>;
}

/** Settings groups share one label, surface and row boundary contract. */
export function SettingsGroup({title,children}:{title:string;children:ReactNode}){
 return <section className="bo-settings-group"><h2><LocalizedText>{title}</LocalizedText></h2><div className="bo-settings-group-body navigation-group">{children}</div></section>;
}

/** Route links and local detail tabs keep their behavior and share one container. */
export function DetailTabs({children,label,role,panelId,appearance="line"}:{children:ReactNode;label:string;role?:"navigation"|"tablist";panelId?:string;appearance?:"pill"|"line"}){
 const root=useRef<HTMLDivElement>(null);
 const nodes=Children.toArray(children);
 const localTabs=role==='tablist'||(!role&&nodes.length>0&&nodes.every(child=>isValidElement(child)&&child.type==='button'));
 useEffect(()=>{const active=root.current?.querySelector<HTMLElement>('[aria-selected="true"],.active');if(!active)return;const container=root.current!;const left=active.offsetLeft-container.offsetLeft,right=left+active.offsetWidth;if(left<container.scrollLeft)container.scrollLeft=left;else if(right>container.scrollLeft+container.clientWidth)container.scrollLeft=right-container.clientWidth;},[children]);
 return <LocalizedElement as="div" ref={root} className="tabs" data-appearance={appearance} role={localTabs?'tablist':role??'navigation'} aria-label={label}>{nodes.map((child,index)=>{
  if(!localTabs||!isValidElement<{className?:string;onKeyDown?:React.KeyboardEventHandler<HTMLButtonElement>}>(child))return child;
  const selected=child.props.className?.split(/\s+/).includes('active')??false;
  return cloneElement(child,{'role':'tab','aria-selected':selected,tabIndex:selected?0:-1,...(panelId?{id:panelId+'-tab-'+index,'aria-controls':panelId}:{}),onKeyDown:(event:React.KeyboardEvent<HTMLButtonElement>)=>{child.props.onKeyDown?.(event);if(event.defaultPrevented)return;const next=event.key==='Home'?0:event.key==='End'?nodes.length-1:event.key==='ArrowRight'?(index+1)%nodes.length:event.key==='ArrowLeft'?(index+nodes.length-1)%nodes.length:null;if(next===null)return;event.preventDefault();const button=event.currentTarget.parentElement?.children[next] as HTMLButtonElement|undefined;button?.focus();button?.click();}} as Partial<typeof child.props>);
 })}</LocalizedElement>;
}

export function ListSearch({ value, onChange, placeholder = "Suchen ...", ariaLabel = placeholder,autoFocus=false,onCommit }: {
  value: string; onChange: (value: string) => void; placeholder?: string; ariaLabel?:string;autoFocus?:boolean;onCommit?:()=>void;
}) {
  const input=useRef<HTMLInputElement>(null);
  return <label className="searchbox"><Icon name="search" size={19}/><LocalizedElement as="input" ref={input} autoFocus={autoFocus} onKeyDown={event=>{if(event.key==="Enter")onCommit?.()}} type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={ariaLabel}/>{value&&<Button variant="ghost" icon="close" ariaLabel="Suche leeren" className="search-clear" onClick={()=>{onChange("");input.current?.focus()}}/>}</label>;
}

export function RowActions({ label = "Weitere Aktionen", onClick, disabled = false }: { label?: string; onClick: () => void; disabled?: boolean }) {
  return <LocalizedElement as="button" className="bo-row-actions" type="button" onClick={onClick} aria-label={label} title={label} disabled={disabled}><Icon name="more" size={20}/></LocalizedElement>;
}

function sheetValues(root:HTMLElement|null){return formControlSnapshot(root);}

/** Fragments do not create a scroll/ownership boundary for a footer. */
function sheetChildren(nodes:ReactNode):ReactNode[]{
 return Children.toArray(Children.map(nodes,child=>isValidElement<{children?:ReactNode}>(child)&&child.type===Fragment?sheetChildren(child.props.children):child));
}

function sheetForm(child:ReactNode):ReactNode{
 if(!isValidElement<{children?:ReactNode;className?:string}>(child)||!["form","section","div"].includes(child.type as string))return child;
 const content:ReactNode[]=[],actions:ReactNode[]=[];
 for(const node of sheetChildren(child.props.children)){
  if(isValidElement<{className?:string}>(node)&&(node.type===FormActions||node.props.className?.split(/\s+/).some(name=>["filter-sheet-actions","mobile-sticky-save"].includes(name))))actions.push(node);
  else content.push(sheetForm(node));
 }
 if(!actions.length)return cloneElement(child,{children:content});
 return cloneElement(child,{className:[child.props.className,"sheet-form-layout"].filter(Boolean).join(" "),children:<><div className="sheet-form-content">{content}</div><div className="sheet-form-footer">{actions}</div></>});
}

type SheetProps={headerActions?:ReactNode;label:string;lang?:string;ariaLabel?:string;description?:string;open:boolean;onClose:()=>void;children:ReactNode;busy?:boolean;className?:string;layerClassName?:string;actions?:ReactNode;dirty?:boolean;wizard?:boolean;workspace?:boolean;onBrowserBack?:()=>void;closeLabel?:string;discardText?:{title:string;message:string;cancelLabel:string;confirmLabel:string}};
/** One focus/viewport/header/scroll/footer contract for all sheet families.
 * A nested sheet never clears recovery owned by a full-page document editor. */
function Sheet({label,lang,description,open,onClose,children,busy=false,className="",layerClassName="",ariaLabel,actions,kind,dirty,wizard=false,onBrowserBack,closeLabel="Schliessen",discardText,headerActions}:SheetProps&{kind:"action"|"form"|"filter"}){
 const router=useRouter();
 const [destination,setDestination]=useState<string|null>(null);
 const [mounted,setMounted]=useState(false);
 useEffect(()=>{queueMicrotask(()=>setMounted(true))},[]);
 const [discard,setDiscard]=useState(false),[backDiscard,setBackDiscard]=useState(false),[changed,setChanged]=useState(false);
 const isDirty=dirty??changed;
 const leaveBack=useBrowserBackGuard(open&&kind==="form"&&(isDirty||busy||!!onBrowserBack),()=>{if(busy)return;if(onBrowserBack){onBrowserBack();return;}setBackDiscard(true);setDiscard(true)},isDirty||busy);
 const baseline=useRef("");
 const touched=useRef(false);

 const closeRef=useRef<()=>void>(()=>{});
 const dialogRef=useDialogFocus(open&&mounted,()=>closeRef.current());
 // React portal events still traverse their parent tree; a nested editor owns its own dismissal and dirty state.
 const ownsEvent=(target:EventTarget)=>target instanceof Element&&target.closest('[role="dialog"]')===dialogRef.current;

 useEffect(()=>{
  if(!open||(!isDirty&&!busy))return;
  const navigate=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const link=event.target instanceof Element?event.target.closest<HTMLAnchorElement>('a[href]'):null;
   if(!link||link.target==='_blank'||link.hasAttribute('download')||link.closest('[role="dialog"]')!==dialogRef.current)return;
   const url=new URL(link.href,window.location.href);
   if(url.protocol!=="http:"&&url.protocol!=="https:")return;
   if(url.href===window.location.href||url.pathname===window.location.pathname&&url.search===window.location.search&&url.hash)return;
   event.preventDefault();event.stopPropagation();if(busy)return;
   setDestination(url.href);setDiscard(true);
  };
  document.addEventListener('click',navigate,true);
  return()=>document.removeEventListener('click',navigate,true);
 },[open,isDirty,busy,dialogRef]);
 const requestClose=()=>{if(busy)return;if(kind==="form"&&(dirty??sheetValues(dialogRef.current)!==baseline.current)){setDiscard(true);return;}onClose()};
 useEffect(()=>{closeRef.current=requestClose;});
 useEffect(()=>{touched.current=false;if(open)baseline.current=sheetValues(dialogRef.current);let active=true;queueMicrotask(()=>{if(active)setChanged(false)});return()=>{active=false}},[open,mounted,dialogRef]);
 // Async loading may fill fields after opening. Only genuine input freezes the baseline.
 useEffect(()=>{if(open&&!touched.current)baseline.current=sheetValues(dialogRef.current)});
 if(!open||!mounted)return null;
 const body:ReactNode[]=[],footers:ReactNode[]=[];
 for(const child of sheetChildren(children)){
  if(isValidElement<{className?:string;children?:ReactNode;sheet?:boolean}>(child)&&(child.type===FormActions||child.props.className?.split(/\s+/).includes("filter-sheet-actions")))footers.push(child.type===FormActions?cloneElement(child,{sheet:true}):child);
  else if(isValidElement<{className?:string;children?:ReactNode}>(child)&&child.props.className?.split(/\s+/).includes("sheet-body"))body.push(cloneElement(child,{className:child.props.className.replace(/\bsheet-body\b/g,"").trim()}));
  else body.push(sheetForm(child));
 }
 const content=<LocalizedElement as="section" ref={dialogRef} tabIndex={-1} className={`bottom-sheet ${className}`.trim()} lang={lang} data-sheet-kind={kind} data-unsaved={isDirty||busy||undefined} data-wizard={wizard||undefined} role="dialog" aria-modal={true} aria-label={ariaLabel??label} onInvalidCapture={event=>{if(!ownsEvent(event.target))return;if(event.target instanceof Element){const details=event.target.closest("details");if(details instanceof HTMLDetailsElement)details.open=true}}} onInputCapture={event=>{if(ownsEvent(event.target)){touched.current=true;setChanged(sheetValues(dialogRef.current)!==baseline.current)}}} onChangeCapture={event=>{if(ownsEvent(event.target)){touched.current=true;setChanged(sheetValues(dialogRef.current)!==baseline.current)}}} onClickCapture={event=>{if(!ownsEvent(event.target))return;const button=event.target instanceof Element?event.target.closest('button'):null;if(button&&button.dataset.sheetDismiss==='true'){event.preventDefault();event.stopPropagation();requestClose()}}}><><div className="sheet-handle"/><header className="sheet-header"><div><h2><LocalizedText>{label}</LocalizedText></h2>{description&&<p><LocalizedText>{description}</LocalizedText></p>}</div>{headerActions}<LocalizedElement as="button" type="button" className="icon-button" aria-label={closeLabel} disabled={busy} onClick={requestClose}><Icon name="close"/></LocalizedElement></header></><div className="sheet-body" inert={kind==="form"&&busy}>{body}</div>{actions?<FormActions sheet>{actions}</FormActions>:footers}</LocalizedElement>;
 const confirmation=<ConfirmDialog open={discard} closeLabel={closeLabel} title={discardText?.title??"Änderungen verwerfen?"} message={discardText?.message??"Deine Änderungen sind noch nicht gespeichert und gehen verloren."} cancelLabel={discardText?.cancelLabel??"Weiter bearbeiten"} confirmLabel={discardText?.confirmLabel??"Verwerfen"} onCancel={()=>{setDiscard(false);setBackDiscard(false);setDestination(null)}} onConfirm={()=>{if(document.querySelectorAll('[data-sheet-kind="form"]').length<=1&&!document.querySelector('.app-editing .document-entry-page'))window.dispatchEvent(new Event("binso-draft-discard"));setDiscard(false);if(destination){const url=new URL(destination);setDestination(null);allowDraftNavigation();if(url.origin===window.location.origin)router.push(url.pathname+url.search+url.hash);else window.location.assign(url.href)}else if(backDiscard){setBackDiscard(false);leaveBack()}else onClose()}}/>;
 return createPortal(<><div className={`sheet-layer ${layerClassName}`.trim()} onMouseDown={event=>{if(event.target===event.currentTarget)requestClose()}}>{content}</div>{confirmation}</>,document.body);
}
export function ActionSheet(props:SheetProps){
 const [desktop,setDesktop]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(min-width:761px)'),update=()=>setDesktop(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[]);
 // Actions reuse the already established anchored desktop panel. Forms retain
 // the single Sheet owner and its dirty, footer and viewport protections.
 if(desktop&&!props.dirty&&!props.busy&&!props.wizard)return props.open?<HeaderPanel kind="actions" label={props.ariaLabel??props.label} onClose={props.onClose}>{props.description&&<p><LocalizedText>{props.description}</LocalizedText></p>}{props.children}{props.actions}</HeaderPanel>:null;
 return <Sheet {...props} kind="action"/>;
}
export function FormSheet({workspace,...props}:SheetProps){return <Sheet {...props} className={[props.className,workspace?"form-sheet-expanded":undefined].filter(Boolean).join(" ")} kind="form"/>}
export function FilterSheet(props:SheetProps){return <Sheet {...props} kind="filter"/>}

/** The same compact action sheet is used for entity editors on every viewport. */
export function ActionsMenu({label,children,busy=false,header=false,tools=false}:{label:string;children:ReactNode;busy?:boolean;header?:boolean;tools?:boolean}){
 const [open,setOpen]=useState(false),[closeRequested,setCloseRequested]=useState(false),[desktop,setDesktop]=useState(false);
 useEffect(()=>{if(!header&&!tools)return;const media=window.matchMedia('(min-width:761px)'),update=()=>setDesktop(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[header,tools]);
 useEffect(()=>{if(!closeRequested||busy)return;const frame=requestAnimationFrame(()=>{setOpen(false);setCloseRequested(false)});return()=>cancelAnimationFrame(frame)},[closeRequested,busy]);
 const close=()=>{if(!busy){setCloseRequested(false);setOpen(false)}};
 const content=<div className="action-list" onClick={event=>{if(!busy&&event.target instanceof Element&&event.target.closest('button,a'))setCloseRequested(true)}}>{children}</div>;
 return <>{tools?<LocalizedElement as="button" type="button" className="icon-button records-filter-action records-tools-action" aria-label={label} aria-haspopup="dialog" aria-expanded={open} disabled={busy} onClick={()=>setOpen(true)}><SlidersHorizontal size={20} aria-hidden="true"/></LocalizedElement>:<RowActions label={label} disabled={busy} onClick={()=>setOpen(true)}/>}{(header||tools)&&desktop?open&&<HeaderPanel kind="actions" label={label} onClose={close}>{content}</HeaderPanel>:<ActionSheet label={label} open={open} busy={busy} onClose={close}>{content}</ActionSheet>}</>;
}

/** Canonical two-line row shared by entity and financial lists. */
export function ListRow({href,onClick,title,meta,value,valueLabel,status,tone="neutral",compact=false,information=false,translateTitle=true,valuePlacement="separate"}:{translateTitle?:boolean;href?:string;onClick?:()=>void;title:ReactNode;meta:ReactNode;value?:ReactNode;valueLabel?:string;status?:string;tone?:"success"|"warning"|"danger"|"neutral"|"info";compact?:boolean;information?:boolean;valuePlacement?:"separate"|"metadata"}){
 const rowIcon=information&&href?informationDestinations.find(item=>href===item.href||href.startsWith(item.href+'/')||href.startsWith(item.href+'?'))?.icon:undefined;
 const content=<>{rowIcon&&<Icon name={rowIcon} size={18}/>}<b><LocalizedText verbatim={!translateTitle}>{title}</LocalizedText></b><small className={information?"sr-only":undefined}>{meta}</small>{status&&<Status appearance="pill" tone={tone}>{status}</Status>}{value!=null&&<span className="document-summary-amount">{valueLabel&&<small><LocalizedText>{valueLabel}</LocalizedText></small>}<strong>{value}</strong></span>}{(href||onClick)&&!status&&(value==null||!!rowIcon)&&<span className="record-chevron"><Icon name="arrow" size={16}/></span>}</>;
 const className=`document-summary-row${rowIcon?" has-row-icon":""}${value!=null?" has-value":""}${compact?" is-compact":""}${information?" is-information":""}${valuePlacement==='metadata'?' amount-in-metadata':''}`;
 return href?<Link href={href} className={className}>{content}</Link>:onClick?<button type="button" onClick={onClick} className={className}>{content}</button>:<div className={className}>{content}</div>;
}
