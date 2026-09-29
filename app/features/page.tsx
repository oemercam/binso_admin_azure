import type {Metadata} from "next";
import MarketingFeatures from "@/components/marketing-features";
export const metadata:Metadata={title:"Funktionen",description:"CRM, Offerten, Aufträge, Projekte, Zeiterfassung, Spesen, Rechnungen, Finanzen, Personal und Administration in Binso One.",alternates:{canonical:"/features"},openGraph:{title:"Funktionen · Binso One",description:"Durchgängige Schweizer KMU-Prozesse in einer Plattform.",url:"/features"}};
export default function Page(){return <MarketingFeatures/>}
