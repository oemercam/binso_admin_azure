"use client";
import Link from "next/link";
import {ChevronRight,Grid2X2} from "lucide-react";
import {mobileMoreNavigation} from "@/config/navigation";
import {useLocale} from "@/components/locale-provider";
import {usePermissions} from "@/lib/client/use-permissions";
import MobileBackButton from "@/components/mobile/mobile-back-button";

export default function MobileModuleOverviewPage(){
 const {t}=useLocale();const permissions=usePermissions();
 return <div className="page mobile-modules-page">
  <section className="mobile-modules-topbar"><MobileBackButton fallback="/dashboard"/><div><span className="mobile-modules-mark"><Grid2X2 size={16}/></span><h1>{t("Alle Module")}</h1></div><span aria-hidden="true"/></section>
  <div className="mobile-modules-list">{mobileMoreNavigation.map(group=>{const items=group.items.filter(item=>permissions.canModule(item.href.slice(1),"read"));if(!items.length)return null;return <section key={group.label}><h2>{t(group.label)}</h2>{items.map(item=>{const Icon=item.icon;return <Link href={item.href} key={item.href}><span className="mobile-module-row-icon"><Icon size={17}/></span><span>{t(item.label)}</span><ChevronRight size={15}/></Link>})}</section>})}</div>
 </div>;
}
