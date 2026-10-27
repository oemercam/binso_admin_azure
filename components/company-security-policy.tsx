'use client';
import {usePageAccess} from '@/lib/client/page-access';
import {LocalizedText} from '@/lib/client/locale';
import {SettingsGroup} from './binso-ux';
export function CompanySecurityPolicy(){
 const access=usePageAccess();
 if(access.hasPermission?.('users:manage')!==true)return null;
 return <SettingsGroup title="Unternehmenssicherheit"><p><LocalizedText>{'Nach der E-Mail-Bestätigung melden sich Kunden mit E-Mail und Passwort an.'}</LocalizedText></p></SettingsGroup>;
}
