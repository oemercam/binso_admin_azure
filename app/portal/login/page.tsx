import type {Metadata} from "next";
import {LoginPage} from "@/components/auth-pages";
export const metadata:Metadata={title:"Kundenportal anmelden",robots:{index:false,follow:false}};
export default function Page(){return <LoginPage/>}
