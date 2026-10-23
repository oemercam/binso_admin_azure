'use client';
import {LocalizedText} from '@/lib/client/locale';
export function PrivacySettingsButton(){return <button type="button" className="footer-privacy-button" onClick={()=>window.dispatchEvent(new Event('binso:open-privacy-settings'))}><LocalizedText>Cookie-/Datenschutz-Einstellungen</LocalizedText></button>;}
