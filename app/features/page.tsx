import type {Metadata} from "next";import FeaturesMarketingPage from "@/components/marketing/features-marketing-page";
export const metadata:Metadata={title:"Funktionen",description:"CRM, Offerten, Aufträge, Projekte, Zeiterfassung, Spesen, Rechnungen, Finanzen und Personal in Binso One für Schweizer KMU.",alternates:{canonical:"/features"},openGraph:{url:"/features",title:"Funktionen · Binso One",description:"Die wichtigsten KMU-Prozesse in einem durchgängigen System."}};
export default function Page(){return <FeaturesMarketingPage/>}
