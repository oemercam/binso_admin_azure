import {LegalLanguageNotice} from './legal-language-notice';
import {cloneElement} from 'react';
import Imprint from '@/app/impressum/page';
import Privacy from '@/app/datenschutz/page';
import Terms from '@/app/agb/page';
import Dpa from '@/app/auftragsbearbeitung/page';
import Processors from '@/app/unterauftragsbearbeiter/page';
import {ActionRow,SettingsGroup} from './binso-ux';

/** Reuse the public source functions verbatim; no duplicated legal clauses. */
export const appLegalDocuments={impressum:{title:'Impressum',render:Imprint},datenschutz:{title:'Datenschutzerklärung',render:Privacy},agb:{title:'AGB',render:Terms},auftragsbearbeitung:{title:'Vereinbarung zur Auftragsbearbeitung',render:Dpa},unterauftragsbearbeiter:{title:'Unterauftragsbearbeiter',render:Processors}};
export function AppLegalNavigation(){return <SettingsGroup title="Rechtliches">{Object.entries(appLegalDocuments).map(([slug,document])=><ActionRow key={slug} href={'/einstellungen/rechtliches/'+slug} icon="file" title={document.title}/>)}</SettingsGroup>}
export function AppLegalDocument({document}:{document:keyof typeof appLegalDocuments}){return <><AppLegalNavigation/><LegalLanguageNotice/>{cloneElement(appLegalDocuments[document].render(),{surface:'app'})}</>}
