import {LocalizedText,LocalizedElement} from "@/lib/client/locale";
import Image from "next/image";

/** Shared SSR/session bootstrap surface; readiness, never a timer, dismisses it. */
export function AppStart(){
 return <LocalizedElement as="div" className="app-launch-screen" role="status" aria-label="Binso One wird geladen" aria-live="polite">
  <Image className="app-start-icon" src="/brand/icon-black.svg" alt="" width={80} height={80} priority/>
  <span className="sr-only"><LocalizedText>{"Binso One wird geladen."}</LocalizedText></span>
 </LocalizedElement>;
}
