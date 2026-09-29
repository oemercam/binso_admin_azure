import { Suspense } from "react";
import Shell from "@/components/shell";
import SettingsPage from "@/components/settings-page";

export default function Page(){
  return <Shell><Suspense fallback={<div className="page"><div className="workspace-card">Einstellungen werden geladen …</div></div>}><SettingsPage/></Suspense></Shell>
}
