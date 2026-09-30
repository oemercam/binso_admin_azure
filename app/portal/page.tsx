"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,isProductionMode} from "@/lib/client/runtime";
import {getOrganization,getSession} from "@/lib/saas-store";
import BrandLogo from "@/components/ui/brand-logo";

export default function PortalEntry(){
 const router=useRouter();
 useEffect(()=>{let active=true;void (async()=>{
  if(isProductionMode()){
   try{const me=await apiFetch<{onboardingComplete:boolean}>("/api/me");if(!active)return;router.replace(me.onboardingComplete?"/dashboard":"/onboarding")}catch{if(active)router.replace("/portal/login")}
  }else{
   const session=getSession();if(!session){router.replace("/portal/login");return}const org=getOrganization(session.orgId);router.replace(org?.onboardingComplete?"/dashboard":"/onboarding")
  }
 })();return()=>{active=false}},[router]);
 return <div className="route-loading-page"><div className="route-loading-mark"><BrandLogo compact/></div><span className="route-loading-label">Binso One wird geöffnet …</span></div>
}
