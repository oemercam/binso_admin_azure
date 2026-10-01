"use client";
import {useRouter} from "next/navigation";
import {ChevronLeft} from "lucide-react";
import {IconButton} from "@/components/ui/icon-button";
import {useLocale} from "@/components/locale-provider";

export default function MobileBackButton({fallback}:{fallback:string}){
 const router=useRouter();const {t}=useLocale();
 return <IconButton type="button" className="mobile-back-button" aria-label={t("Zurück")} onClick={()=>{if(window.history.length>1)router.back();else router.push(fallback)}}><ChevronLeft size={20}/></IconButton>;
}
