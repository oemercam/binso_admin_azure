"use client";

import {useLocale} from "@/components/locale-provider";

export default function LocalizedText({children}:{children:string}){
 const {t}=useLocale();
 return <>{t(children)}</>;
}
