"use client";
import {AppShell} from '../app-shell';
import {AbsenceRequests} from '../absence-requests';
import {SettingsWorkspace} from '../settings-navigation';
export function AbsencesPage(){return <AppShell title="Abwesenheiten" active="abwesenheiten"><AbsenceRequests scope="team"/></AppShell>;}
export function OwnAbsencesPage(){return <AppShell title="Meine Abwesenheiten" active="einstellungen"><SettingsWorkspace><AbsenceRequests scope="self"/></SettingsWorkspace></AppShell>;}
