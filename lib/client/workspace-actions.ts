"use client";
import {createContext,type ReactNode} from 'react';
/** Route content contributes context actions to the shared desktop command bar. */
export const WorkspaceActionContext=createContext<((id:string,content:ReactNode|null)=>void)|null>(null);
