import Link from "next/link";
import {MarketingHeader,MarketingFooter} from "@/components/marketing";
export function LegalPage({eyebrow,title,children}:{eyebrow:string;title:string;children:React.ReactNode}){return <><MarketingHeader/><main className="marketing-page legal-page"><section className="section"><div className="section-head"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>Stand: 3. Oktober 2026</p></div><div className="legal-content">{children}</div></section></main><MarketingFooter/></>}
export const company=<><b>Binso GmbH</b><br/>Weissbadstrasse 8b<br/>9050 Appenzell<br/>Schweiz<br/>CHE-173.401.068<br/><a href="mailto:oemer.cam@binso.ch">oemer.cam@binso.ch</a><br/><a href="tel:+41585108858">+41 58 510 88 58</a></>;
export const legalLinks=<p><Link href="/agb">AGB</Link> · <Link href="/datenschutz">Datenschutz</Link> · <Link href="/impressum">Impressum</Link></p>;
