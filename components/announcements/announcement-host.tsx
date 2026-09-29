"use client";
import {useEffect,useState} from "react";import {usePathname} from "next/navigation";import Link from "next/link";import {apiFetch,isProductionMode} from "@/lib/client/runtime";import {localAnnouncements,type Announcement} from "@/lib/pilot-store";import {useFeatureFlags} from "@/lib/client/use-feature-flags";
export default function AnnouncementHost(){
 const pathname=usePathname();const [item,setItem]=useState<Announcement|null>(null);const {ready,enabled}=useFeatureFlags();
 useEffect(()=>{if(!ready||!enabled("announcements")||pathname.startsWith("/operator")||pathname==="/"||pathname.startsWith("/login")||pathname.startsWith("/registrieren"))return;const load=async()=>{let items=localAnnouncements;if(isProductionMode()){try{items=(await apiFetch<{items:Announcement[]}>("/api/announcements")).items}catch{}}const first=items.find(x=>x.active&&localStorage.getItem(`binso-announcement-${x.id}`)!=="dismissed");setItem(first||null)};void load()},[pathname,ready,enabled]);
 if(!item)return null;return <div className={`announcement-bar ${item.kind}`}><div><strong>{item.title}</strong><span>{item.message}</span></div><Link href="/neuigkeiten">Details</Link><button onClick={()=>{localStorage.setItem(`binso-announcement-${item.id}`,"dismissed");setItem(null)}} aria-label="Hinweis schliessen">×</button></div>
}
