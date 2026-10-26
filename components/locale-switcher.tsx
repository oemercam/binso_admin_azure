'use client';
import {SelectControl} from './select-control';
import {LocalizedText} from '@/lib/client/locale';
import {useLanguagePreference} from '@/lib/client/use-language-preference';
import {localeNames,locales} from '@/lib/locales/config';
import {ErrorState} from './ui';
export function LocaleSwitcher({compact=false,persist=false}:{compact?:boolean;persist?:false|"tenant"|"operator"}){
 const {locale,save,busy,error}=useLanguagePreference(persist);
 return <><label className={compact?'locale-switcher is-compact':'locale-switcher'}><span><LocalizedText>Sprache</LocalizedText></span><SelectControl popupKind="language" displayValue={locale.toUpperCase()} title={localeNames[locale]} aria-label="Sprache" value={locale} disabled={busy} aria-busy={busy||undefined} onChange={event=>void save(event.target.value)}>{locales.map(code=><option key={code} value={code} lang={code}>{localeNames[code]}</option>)}</SelectControl></label>{error&&<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>}</>;
}
