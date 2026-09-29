import {Suspense} from "react";
import type {Metadata} from "next";
import {RegisterPage} from "@/components/auth-pages";
export const metadata:Metadata={title:"Kundenportal registrieren",robots:{index:false,follow:false}};
export default function Page(){return <Suspense fallback={<div className="auth-shell"><div className="auth-card">Registrierung wird geladen …</div></div>}><RegisterPage/></Suspense>}
