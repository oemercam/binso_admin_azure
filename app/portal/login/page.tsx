import type { Metadata } from "next";
import { PortalLogin } from "@/components/portal";
export const metadata:Metadata={title:"Kundenportal anmelden | Binso One",robots:{index:false,follow:false}};
export default function Page(){return <PortalLogin/>}
