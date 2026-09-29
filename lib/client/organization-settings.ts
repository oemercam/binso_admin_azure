"use client";
import {apiFetch,isProductionMode} from "@/lib/client/runtime";import {defaultSettings,loadSettings,type DemoSettings} from "@/lib/local-store";
type Org={name?:string;uid?:string;address?:string;zipCity?:string;phone?:string;settings?:Partial<DemoSettings>};
export async function loadOrganizationSettings():Promise<DemoSettings>{if(!isProductionMode())return loadSettings();try{const {organization}=await apiFetch<{organization:Org}>("/api/organization");return {...defaultSettings,...(organization.settings||{}),companyName:organization.name||defaultSettings.companyName,uid:organization.uid||"",address:organization.address||"",zipCity:organization.zipCity||"",phone:organization.phone||""}}catch{return defaultSettings}}
