import {Suspense} from "react";
import type {Metadata} from "next";
import {DemoPage} from "@/components/auth-pages";
import LocalizedText from "@/components/i18n/localized-text";
export const metadata:Metadata={title:"Demo",description:"Binso One unverbindlich kennenlernen und die Schweizer KMU-Plattform im Demo-Modus testen.",alternates:{canonical:"/demo"}};
export default function Page(){return <Suspense fallback={<div className="auth-shell"><div className="auth-card"><LocalizedText>Demo wird geladen …</LocalizedText></div></div>}><DemoPage/></Suspense>}
