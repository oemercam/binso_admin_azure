import {Suspense} from "react";
import type {Metadata} from "next";
import {RegisterPage} from "@/components/auth-pages";
import LocalizedText from "@/components/i18n/localized-text";
export const metadata:Metadata={title:"Kundenportal registrieren",robots:{index:false,follow:false}};
export default function Page(){return <Suspense fallback={<div className="auth-shell"><div className="auth-card"><LocalizedText>Registrierung wird geladen …</LocalizedText></div></div>}><RegisterPage/></Suspense>}
