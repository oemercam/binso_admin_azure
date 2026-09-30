import { Suspense } from "react";
import SettingsPage from "@/components/settings-page";
import LocalizedText from "@/components/i18n/localized-text";

export default function Page(){
  return <Suspense fallback={<div className="page"><div className="workspace-card"><LocalizedText>Einstellungen werden geladen …</LocalizedText></div></div>}><SettingsPage/></Suspense>
}
