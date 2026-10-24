"use client";

import {useCallback,useState} from "react";
import {formSnapshot} from '@/lib/client/form-snapshot';

/** Compare actual editable values, including restoring the original values. */
export function useDirtySnapshot(value:unknown){
 const serialized=formSnapshot(value);
 const [baseline,setBaseline]=useState(serialized);
 const markPristine=useCallback((next:unknown)=>setBaseline(formSnapshot(next)),[]);
 return {dirty:serialized!==baseline,markPristine};
}
