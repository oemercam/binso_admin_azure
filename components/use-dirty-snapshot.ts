"use client";

import {useCallback,useState} from "react";

/** Compare actual editable values, including restoring the original values. */
export function useDirtySnapshot(value:unknown){
 const serialized=JSON.stringify(value);
 const [baseline,setBaseline]=useState(serialized);
 const markPristine=useCallback((next:unknown)=>setBaseline(JSON.stringify(next)),[]);
 return {dirty:serialized!==baseline,markPristine};
}
