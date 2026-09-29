"use client";
import {useEffect,useState} from "react";
export default function PwaUpdateNotice(){const [ready,setReady]=useState(false);useEffect(()=>{const h=()=>setReady(true);window.addEventListener("binso-pwa-update",h);return()=>window.removeEventListener("binso-pwa-update",h)},[]);if(!ready)return null;return <div className="pwa-update-notice" role="status"><span>Neue Version verfügbar.</span><button type="button" onClick={()=>window.dispatchEvent(new Event("binso-pwa-apply-update"))}>Aktualisieren</button></div>}
