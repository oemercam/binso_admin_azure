'use client';
import {Select} from './ui';
import {useLocale,LocalizedText} from '@/lib/client/locale';
import {asLocale,localeNames,locales} from '@/lib/locales';
export function LocaleSwitcher({compact=false}:{compact?:boolean}){
 const {locale,choose}=useLocale();
 return <label className={compact?'locale-switcher is-compact':'locale-switcher'}><span><LocalizedText>Sprache</LocalizedText></span><Select aria-label="Sprache" value={locale} onChange={event=>choose(asLocale(event.target.value))}>{locales.map(code=><option key={code} value={code} lang={code}>{compact?code.toUpperCase():localeNames[code]}</option>)}</Select></label>;
}
