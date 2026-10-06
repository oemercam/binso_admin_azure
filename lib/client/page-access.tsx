"use client";
import {createContext,useContext} from "react";
export const PageAccessContext=createContext<{write:boolean;canOpen:(href:string)=>boolean}>({write:true,canOpen:()=>true});
export function usePageAccess(){return useContext(PageAccessContext)}
