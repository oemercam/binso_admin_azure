"use client";

import Link from "next/link";
import {Grid2X2} from "lucide-react";
import {useLocale} from "@/components/locale-provider";

export default function MobileModuleLauncher({className=""}:{className?:string}){
 const {t}=useLocale();
 return <Link href="/module" className={`mobile-module-launcher-button${className?` ${className}`:""}`} aria-label={t("Alle Module")}><Grid2X2 size={18}/></Link>;
}
