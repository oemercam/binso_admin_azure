"use client";
import {ArrowLeft} from "lucide-react";
import {useRouter} from "next/navigation";
import {IconButton} from "@/components/ui/icon-button";
import {useLocale} from "@/components/locale-provider";

export default function PageBackButton({href,onBeforeNavigate,className=""}:{href?:string;onBeforeNavigate?:()=>void|Promise<void>;className?:string}){
 const router=useRouter();
 const {t}=useLocale();
 async function back(){
  if(onBeforeNavigate){await onBeforeNavigate();return}
  if(typeof window!=="undefined"&&window.history.length>1){router.back();return}
  router.push(href||"/dashboard");
 }
 return <IconButton type="button" className={`page-back-button ${className}`.trim()} aria-label={t("Zurück")} onClick={()=>void back()}><ArrowLeft size={19}/></IconButton>;
}
