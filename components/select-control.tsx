"use client";
import {Children,Fragment,cloneElement,isValidElement,useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {LocalizedElement} from '@/lib/client/locale';
import {lockPageScroll} from './page-scroll-lock';

/** Retain real form/autofill/validation semantics; pointer and keyboard use the app listbox. */
export function SelectControl(props:React.ComponentProps<'select'>){
 const trigger=useRef<HTMLButtonElement>(null);
 const [caption,setCaption]=useState('');
 const control=useRef<HTMLSelectElement>(null),popup=useRef<HTMLDivElement>(null),id=useId();
 const [open,setOpen]=useState(false),[active,setActive]=useState(0),[position,setPosition]=useState({left:0,top:0,width:0,height:0});
 const [options,setOptions]=useState<Array<{value:string;text:string;disabled:boolean;hidden:boolean;selected:boolean}>>([]);
 const enabled=(index:number)=>!!options[index]&&!options[index].disabled&&!options[index].hidden;
 const close=()=>setOpen(false);
 const available=(option:HTMLOptionElement)=>!option.disabled&&!option.hidden&&!(option.parentElement instanceof HTMLOptGroupElement&&option.parentElement.disabled);
 const show=()=>{if(props.disabled||props.multiple||!control.current)return;const items=Array.from(control.current.options,option=>({value:option.value,text:option.text,disabled:!available(option),hidden:option.hidden,selected:option.selected}));if(!items.some(option=>!option.disabled))return;setOptions(items);const selected=control.current.selectedIndex;setActive(items[selected]&&!items[selected].disabled?selected:items.findIndex(option=>!option.disabled));setOpen(true);};
 useLayoutEffect(()=>{const text=control.current?.selectedOptions[0]?.text??'';if(text!==caption)setCaption(text);},[caption,props.value,props.children]);
 const choose=(index:number)=>{const option=control.current?.options[index];if(!enabled(index)||!control.current||!option||!available(option)||option.value!==options[index].value)return;control.current.selectedIndex=index;control.current.dispatchEvent(new Event('change',{bubbles:true}));setCaption(option.text);close();trigger.current?.focus({preventScroll:true});};
 useLayoutEffect(()=>{
  if(!open)return;
  const place=()=>{const rect=trigger.current?.getBoundingClientRect();if(!rect)return;const viewport=window.visualViewport,top=viewport?.offsetTop??0,bottom=top+(viewport?.height??innerHeight),below=bottom-rect.bottom-12,above=rect.top-top-12,height=Math.min(320,Math.max(below,above));setPosition({left:Math.max(12,Math.min(rect.left,innerWidth-rect.width-12)),top:below>=Math.min(240,above)?rect.bottom+4:Math.max(top+12,rect.top-height-4),width:Math.min(rect.width,innerWidth-24),height});};
  place();const unlock=lockPageScroll(()=>popup.current);
  const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!trigger.current?.contains(event.target)&&!popup.current?.contains(event.target))close();};
  document.addEventListener('pointerdown',outside,true);window.addEventListener('resize',place);window.visualViewport?.addEventListener('resize',place);window.visualViewport?.addEventListener('scroll',place);
  return()=>{unlock();document.removeEventListener('pointerdown',outside,true);window.removeEventListener('resize',place);window.visualViewport?.removeEventListener('resize',place);window.visualViewport?.removeEventListener('scroll',place);};
 },[open]);
 useEffect(()=>{if(open)popup.current?.querySelector('[data-active="true"]')?.scrollIntoView({block:'nearest'});},[open,active]);
 const typeahead=useRef({text:'',at:0});
 const optionChildren=(nodes:React.ReactNode):React.ReactNode=>Children.map(nodes,child=>isValidElement<{children?:React.ReactNode;'aria-hidden'?:boolean}>(child)?child.type==='option'?cloneElement(child,{'aria-hidden':open||undefined}):child.type==='optgroup'||child.type===Fragment?cloneElement(child,{children:optionChildren(child.props.children)}):child:child);
 return <><span className="app-select-control"><LocalizedElement as="select" {...props} ref={control} tabIndex={-1} onFocus={()=>trigger.current?.focus({preventScroll:true})} aria-hidden="true" className="app-select-native" data-app-select="true" onInvalid={event=>{props.onInvalid?.(event);event.preventDefault();trigger.current?.focus({preventScroll:true});}}>{optionChildren(props.children)}</LocalizedElement><LocalizedElement as="button" ref={trigger} type="button" role="combobox" disabled={props.disabled} className={[props.className,'form-control','app-select-trigger'].filter(Boolean).join(' ')} aria-label={props['aria-label']} aria-labelledby={props['aria-labelledby']} aria-describedby={props['aria-describedby']} aria-required={props.required} aria-invalid={props['aria-invalid']} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?id:undefined} aria-activedescendant={open?`${id}-${active}`:undefined} data-select-id={props.id} onClick={()=>{if(open)close();else show();}} onBlur={()=>close()} onKeyDown={event=>{
  if(event.defaultPrevented||props.multiple)return;
  if(event.key==='Tab'){close();return;}
  if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();close();return;}
  if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(event.key)){
   event.preventDefault();if(!open){show();if(event.key==='Home'||event.key==='End'){const indices=Array.from(control.current?.options??[]).map((option,index)=>available(option)?index:-1).filter(index=>index>=0);setActive(event.key==='Home'?indices[0]??0:indices.at(-1)??0);}return;}if(event.key==='Enter'||event.key===' '){choose(active);return;}
   const indices=options.map((_,i)=>i).filter(enabled),at=indices.indexOf(active);setActive(event.key==='Home'?indices[0]:event.key==='End'?indices.at(-1)!:indices[Math.max(0,Math.min(indices.length-1,at+(event.key==='ArrowDown'?1:-1)))]??active);
  }else if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();const now=Date.now();typeahead.current={text:(open&&now-typeahead.current.at<700?typeahead.current.text:'')+event.key.toLocaleLowerCase(),at:now};if(!open)show();const index=Array.from(control.current?.options??[]).findIndex(option=>available(option)&&option.text.toLocaleLowerCase().startsWith(typeahead.current.text));if(index>=0)setActive(index);}
 }}>{caption||"—"}<span aria-hidden="true">⌄</span></LocalizedElement></span>{open&&createPortal(<div ref={popup} id={id} className="app-select-popup" role="listbox" aria-label={props['aria-label']} aria-labelledby={props['aria-labelledby']} style={{'--select-left':`${position.left}px`,'--select-top':`${position.top}px`,'--select-width':`${position.width}px`,'--select-height':`${position.height}px`} as React.CSSProperties} onPointerDown={event=>event.preventDefault()}>{options.map((option,index)=><div key={index} id={`${id}-${index}`} role="option" aria-selected={option.selected} aria-disabled={option.disabled||undefined} hidden={option.hidden} data-active={active===index||undefined} className="app-select-option" onPointerMove={()=>{if(enabled(index))setActive(index)}} onClick={()=>choose(index)}>{option.text}{option.selected&&<span aria-hidden="true">✓</span>}</div>)}</div>,document.body)}</>;
}
