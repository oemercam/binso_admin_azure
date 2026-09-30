"use client";
import BrandLogo from "@/components/ui/brand-logo";
import {useLocale} from "@/components/locale-provider";
export default function Loading(){const {t}=useLocale();return <main className="route-loading-page" role="status" aria-label={t("Ansicht wird geladen")}><div className="route-loading-mark" aria-hidden="true"><BrandLogo compact/></div></main>}
