"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  customers,
  employees,
  expenses,
  invoices,
  offers,
  payments,
  products,
  supportTickets,
} from "@/lib/demo-data";

export type DemoCollection =
  | "customers"
  | "employees"
  | "expenses"
  | "invoices"
  | "offers"
  | "payments"
  | "products"
  | "supportTickets";

export type DemoDataState = Record<DemoCollection, string[][]>;

const STORAGE_KEY = "binso.demo.data.v1";

function cloneRows(rows: string[][]) {
  return rows.map((row) => [...row]);
}

function createInitialState(): DemoDataState {
  return {
    customers: cloneRows(customers),
    employees: cloneRows(employees),
    expenses: cloneRows(expenses),
    invoices: cloneRows(invoices),
    offers: cloneRows(offers),
    payments: cloneRows(payments),
    products: cloneRows(products),
    supportTickets: cloneRows(supportTickets),
  };
}

type DemoDataContextValue = {
  data: DemoDataState;
  addRecord: (collection: DemoCollection, row: string[]) => void;
  updateRecord: (collection: DemoCollection, index: number, row: string[]) => void;
  removeRecord: (collection: DemoCollection, index: number) => void;
  resetDemoData: () => void;
};

const DemoDataContext = createContext<DemoDataContextValue | null>(null);

export function DemoDataProvider({ children }: { children: React.ReactNode }) {
  const [data,setData]=useState<DemoDataState>(createInitialState);
  const [hydrated,setHydrated]=useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw=window.localStorage.getItem(STORAGE_KEY);
        if(raw){
          const parsed=JSON.parse(raw) as Partial<DemoDataState>;
          const initial=createInitialState();
          setData({
            customers: Array.isArray(parsed.customers) ? parsed.customers : initial.customers,
            employees: Array.isArray(parsed.employees) ? parsed.employees : initial.employees,
            expenses: Array.isArray(parsed.expenses) ? parsed.expenses : initial.expenses,
            invoices: Array.isArray(parsed.invoices) ? parsed.invoices : initial.invoices,
            offers: Array.isArray(parsed.offers) ? parsed.offers : initial.offers,
            payments: Array.isArray(parsed.payments) ? parsed.payments : initial.payments,
            products: Array.isArray(parsed.products) ? parsed.products : initial.products,
            supportTickets: Array.isArray(parsed.supportTickets) ? parsed.supportTickets : initial.supportTickets,
          });
        }
        setHydrated(true);
      } catch {
        setData(createInitialState());
        setHydrated(true);
      }
    });
  }, []);

  useEffect(() => {
    if(!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
  }, [data,hydrated]);

  const value=useMemo<DemoDataContextValue>(()=>({
    data,
    addRecord:(collection,row)=>setData(current=>({...current,[collection]:[[...row],...current[collection]]})),
    updateRecord:(collection,index,row)=>setData(current=>({...current,[collection]:current[collection].map((item,itemIndex)=>itemIndex===index?[...row]:item)})),
    removeRecord:(collection,index)=>setData(current=>({...current,[collection]:current[collection].filter((_,itemIndex)=>itemIndex!==index)})),
    resetDemoData:()=>setData(createInitialState()),
  }),[data]);

  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
}

export function useDemoData() {
  const value=useContext(DemoDataContext);
  if(!value) throw new Error("useDemoData must be used inside DemoDataProvider");
  return value;
}
