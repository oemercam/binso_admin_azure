import type {Metadata} from "next";import PricingMarketingPage from "@/components/marketing/pricing-marketing-page";
export const metadata:Metadata={title:"Preise",description:"Pläne und Preise von Binso One für Schweizer KMU. Transparent starten und bei Bedarf erweitern.",alternates:{canonical:"/preise"},openGraph:{url:"/preise",title:"Preise · Binso One",description:"Transparente SaaS-Pläne für Schweizer KMU."}};
export default function Page(){return <PricingMarketingPage/>}
