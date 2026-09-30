import {domainConfig} from "@/config/domain";
import type {DocumentPosition} from "@/lib/documents/calculations";

export const demoDocumentPositions:DocumentPosition[]=[
 {description:"Beratung / Projektleistung",quantity:8,unitPrice:150,vatRate:domainConfig.defaultVatRate},
 {description:"Dokumentation",quantity:2,unitPrice:120,vatRate:domainConfig.defaultVatRate},
];

export function createBlankDocumentPosition():DocumentPosition{
 return {description:"",quantity:1,unitPrice:0,vatRate:domainConfig.defaultVatRate};
}

export function initialDocumentPositions(demo:boolean):DocumentPosition[]{
 return demo?demoDocumentPositions.map(position=>({...position})):[createBlankDocumentPosition()];
}
