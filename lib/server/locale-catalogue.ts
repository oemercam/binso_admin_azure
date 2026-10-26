import 'server-only';
import de from '@/lib/locales/generated/de.json';
import en from '@/lib/locales/generated/en.json';
import fr from '@/lib/locales/generated/fr.json';
import it from '@/lib/locales/generated/it.json';
import tr from '@/lib/locales/generated/tr.json';
import type {Locale} from '@/lib/locales/config';
import type {LocaleCatalogue} from '@/lib/locales/translator';
const catalogues:Record<Locale,LocaleCatalogue>={de,en,fr,it,tr};
export function getLocaleCatalogue(locale:Locale){return catalogues[locale]}
