'use client';
import {AppShell} from '../app-shell';
import {ActionRow,SettingsGroup} from '../binso-ux';
/** Help links reuse existing destinations and their access checks; no parallel settings or support flow. */
export function HelpPage(){
 return <AppShell title="Hilfe & Informationen" active="hilfe">
  <SettingsGroup title="Hilfe"><ActionRow href="/support" icon="support" title="Support" navigation/><ActionRow href="/einstellungen/rechtliches" icon="file" title="Rechtliches" navigation/></SettingsGroup>
  <SettingsGroup title="Persönlich"><ActionRow href="/einstellungen/sicherheit" icon="lock" title="Sicherheit" navigation/><ActionRow href="/einstellungen/benachrichtigungen" icon="bell" title="Benachrichtigungen" navigation/></SettingsGroup>
 </AppShell>;
}
