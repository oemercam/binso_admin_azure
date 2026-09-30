"use client";
import {useLocale} from "@/components/locale-provider";
import {emitAppEvent,appEvents} from "@/lib/client/app-events";
import {Button} from "@/components/ui/button";
export default function CookieSettingsButton(){const {t}=useLocale();return <Button variant="secondary" onClick={()=>emitAppEvent(appEvents.openConsent)}>{t("Cookie-Einstellungen öffnen")}</Button>}
