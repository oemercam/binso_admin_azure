import type {Metadata} from "next";
import ContactMarketingPage from "@/components/marketing/contact-marketing-page";
export const metadata:Metadata={title:"Kontakt",description:"Kontakt zu Binso GmbH und Binso One in Appenzell, Schweiz.",alternates:{canonical:"/kontakt"}};
export default function Page(){return <ContactMarketingPage/>}
