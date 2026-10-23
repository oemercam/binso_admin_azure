'use client';
import {useLocale,LocalizedText} from '@/lib/client/locale';
/** Translation approval is not inferred from the existence of catalogue text. */
export function LegalLanguageNotice(){const {locale}=useLocale();return locale==='de'?null:<p className="settings-note" role="note"><LocalizedText>Für diese Rechtsübersetzung liegt kein Freigabenachweis vor.</LocalizedText></p>}
