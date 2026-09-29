import LegalPage from "@/components/legal/legal-page";import {subprocessors} from "@/lib/legal";
export const metadata={title:"Unterauftragsbearbeiter"};
export default function Page(){return <LegalPage title="Unterauftragsbearbeiter" lead="Transparente Übersicht der für Binso One vorgesehenen technischen Dienstleister.">
<div className="legal-table"><div className="legal-table-head"><span>Anbieter</span><span>Zweck</span><span>Region</span></div>{subprocessors.map(x=><div key={x.name}><strong>{x.name}</strong><span>{x.purpose}</span><span>{x.region}</span></div>)}</div>
<p>Die tatsächlich eingesetzten Dienste hängen von der produktiven Konfiguration ab. Vor Aktivierung zusätzlicher Unterauftragsbearbeiter wird diese Liste aktualisiert.</p>
</LegalPage>}
