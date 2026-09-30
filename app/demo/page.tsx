import {Suspense} from "react";
import type {Metadata} from "next";
import {DemoPage} from "@/components/auth-pages";
export const metadata:Metadata={title:"Demo",description:"Binso One unverbindlich kennenlernen und die Schweizer KMU-Plattform im Demo-Modus testen.",alternates:{canonical:"/demo"}};
export default function Page(){return <Suspense fallback={<div className="auth-shell"><div className="auth-card">Demo wird geladen …</div></div>}><DemoPage/></Suspense>}
