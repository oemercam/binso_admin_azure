import type {Metadata} from "next";
import MarketingPricing from "@/components/marketing-pricing";
export const metadata:Metadata={title:"Preise",description:"Pläne und Preise von Binso One für Schweizer KMU. Transparent starten und den Funktionsumfang passend zum Unternehmen wählen.",alternates:{canonical:"/preise"},openGraph:{title:"Preise · Binso One",description:"Transparente Pläne für Schweizer KMU.",url:"/preise"}};
export default function Page(){return <MarketingPricing/>}
