"use client";
import {useEffect,useState} from "react";import {usePathname} from "next/navigation";import Link from "next/link";import {apiFetch,isProductionMode} from "@/lib/client/runtime";import {localAnnouncements,type Announcement} from "@/lib/pilot-store";import {useLocale} from "@/components/locale-provider";import {readTextStorage,writeTextStorage} from "@/lib/client/browser-storage";
import {announcementStorageKey} from "@/config/storage-keys";
export default function AnnouncementHost(){
 const {t}=useLocale();const pathname=usePathname();const [item,setItem]=useState<Announcement|null>(null);
 useEffect(()=>{if(pathname.startsWith("/operator")||pathname==="/"||pathname.startsWith("/login")||pathname.startsWith("/registrieren"))return;const load=async()=>{let items=localAnnouncements;if(isProductionMode()){try{items=(await apiFetch<{items:Announcement[]}>("/api/announcements")).items}catch{}}const first=items.find(x=>x.active&&readTextStorage(announcementStorageKey(x.id))!=="dismissed");setItem(first||null)};void load()},[pathname]);
 if(!item)return null;return <div className={`announcement-bar ${item.kind}`}><div><strong>{t(item.title)}</strong><span>{t(item.message)}</span></div><Link href="/neuigkeiten">{t("Details")}</Link><button onClick={()=>{writeTextStorage(announcementStorageKey(item.id),"dismissed");setItem(null)}} aria-label={t("Hinweis schliessen")}>×</button></div>
}
