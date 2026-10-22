"use client";
import type {TenantPermission} from "@/lib/permissions";
import {createContext,useContext} from "react";
export const PageAccessContext=createContext<{write:boolean;canOpen:(href:string)=>boolean;hasPermission?:(permission:TenantPermission)=>boolean}>({write:true,canOpen:()=>true});
export function usePageAccess(){return useContext(PageAccessContext)}
