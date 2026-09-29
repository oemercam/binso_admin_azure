import Link from "next/link";import BrandLogo from "@/components/ui/brand-logo";import StatusClient from "@/components/status/status-client";
export const metadata={title:"Systemstatus",description:"Öffentlicher Systemstatus der Binso One Plattform."};
export default function Page(){return <div className="status-shell"><header><Link href="/"><BrandLogo/></Link><span>Systemstatus</span></header><main><StatusClient/></main><footer><Link href="/support">Support</Link><Link href="/datenschutz">Datenschutz</Link></footer></div>}
