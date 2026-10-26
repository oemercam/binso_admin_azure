import {LocalizedText,LocalizedElement} from "@/lib/client/locale";
import Link from "next/link";
import {MarketingFooter,MarketingHeader} from "@/components/marketing";
import {Children,cloneElement,isValidElement,type ReactNode} from 'react';

function headingText(value:ReactNode):string{
 return Children.toArray(value).map(node=>typeof node==='string'||typeof node==='number'?String(node):isValidElement<{children?:ReactNode}>(node)?headingText(node.props.children):'').join('');
}

export function LegalPage({eyebrow,title,intro,children,surface="public"}:{eyebrow:string;title:string;intro:string;children:React.ReactNode;surface?:"public"|"app"}){
  const internal=(nodes:ReactNode):ReactNode=>Children.map(nodes,node=>{if(!isValidElement<{children?:ReactNode;href?:string}>(node))return node;const href=node.props.href;const target=typeof href==='string'&&/^\/(impressum|datenschutz|agb|auftragsbearbeitung|unterauftragsbearbeiter)(?=[?#]|$)/.test(href)?'/einstellungen/rechtliches'+href:href;return cloneElement(node,{...(href?{href:target}:{}),...(node.props.children?{children:internal(node.props.children)}:{})})});
  const anchors:Array<{id:string;title:string}>=[],used=new Set<string>();
  const content=Children.map(surface==="app"?internal(children):children,(node,index)=>{
    if(!isValidElement<{children?:ReactNode;id?:string;tabIndex?:number}>(node)||node.type!=='section')return node;
    const heading=Children.toArray(node.props.children).find(child=>isValidElement(child)&&child.type==='h2');
    const text=isValidElement<{children?:ReactNode}>(heading)?headingText(heading.props.children):'';
    if(!text.trim())return node;
    const slug=text.replace(/^\d+\.\s*/,'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    let id=node.props.id||'legal-'+(slug||'section-'+index);if(used.has(id))id+='-'+index;used.add(id);anchors.push({id,title:text});
    return cloneElement(node,{id,tabIndex:-1});
  });
  const body=<main className={surface==="app"?"legal-page app-legal-page":"legal-page"}>
    <header className="legal-hero"><span className="eyebrow"><LocalizedText>{eyebrow}</LocalizedText></span>{surface==="public"&&<h1><LocalizedText>{title}</LocalizedText></h1>}<p><LocalizedText>{intro}</LocalizedText></p></header>
    {anchors.length>=5&&<details className="legal-toc"><summary><LocalizedText>Inhalt</LocalizedText></summary><LocalizedElement as="nav" aria-label="Inhaltsverzeichnis"><ol>{anchors.map(anchor=><li key={anchor.id}><a href={'#'+anchor.id}><LocalizedText>{anchor.title}</LocalizedText></a></li>)}</ol></LocalizedElement></details>}
    <article className="legal-content">{content}</article>
    {surface==="public"&&<LocalizedElement as="nav" className="legal-related" aria-label="Rechtliche Dokumente">
      <Link href="/impressum"><LocalizedText>{"Impressum"}</LocalizedText></Link>
      <Link href="/datenschutz"><LocalizedText>{"Datenschutz"}</LocalizedText></Link>
      <Link href="/agb"><LocalizedText>{"AGB"}</LocalizedText></Link>
      <Link href="/auftragsbearbeitung"><LocalizedText>{"Auftragsbearbeitung"}</LocalizedText></Link>
      <Link href="/unterauftragsbearbeiter"><LocalizedText>{"Unterauftragsbearbeiter"}</LocalizedText></Link>
    </LocalizedElement>}
  </main>;
  return surface==="app"?body:<><MarketingHeader/>{body}<MarketingFooter/></>;
}
