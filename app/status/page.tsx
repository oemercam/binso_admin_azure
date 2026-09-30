import MarketingFrame from "@/components/marketing/marketing-frame";
import StatusClient from "@/components/status/status-client";

export const metadata={title:"Systemstatus",description:"Aktueller Systemstatus der Binso One Plattform."};

export default function Page(){return <MarketingFrame><section className="legal-main status-public-page"><div className="legal-kicker">Binso One · Status</div><h1>Systemstatus</h1><p className="legal-lead">Aktueller Zustand der wichtigsten Binso-One-Dienste.</p><StatusClient/></section></MarketingFrame>}
