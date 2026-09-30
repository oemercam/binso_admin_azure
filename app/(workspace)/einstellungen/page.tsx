import { Suspense } from "react";
import SettingsPage from "@/components/settings-page";

export default function Page(){
  return <Suspense fallback={<div className="page"><div className="workspace-card">Einstellungen werden geladen …</div></div>}><SettingsPage/></Suspense>
}
