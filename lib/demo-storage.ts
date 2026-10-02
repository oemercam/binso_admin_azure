export type DemoCollection = "customers" | "products" | "employees" | "expenses" | "payments";

const prefix = "binso.demo.collection.";

function keyFor(collection:DemoCollection) {
  return `${prefix}${collection}`;
}

export function readDemoRows(collection:DemoCollection): string[][] {
  if(typeof window==="undefined") return [];
  const raw=window.localStorage.getItem(keyFor(collection));
  if(!raw) return [];
  try {
    const parsed=JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((row):row is string[]=>Array.isArray(row)&&row.every(value=>typeof value==="string")) : [];
  } catch {
    return [];
  }
}

export function appendDemoRow(collection:DemoCollection,row:string[]) {
  if(typeof window==="undefined") return;
  const current=readDemoRows(collection);
  window.localStorage.setItem(keyFor(collection),JSON.stringify([row,...current]));
  window.dispatchEvent(new CustomEvent("binso-demo-data",{detail:{collection}}));
}

export function clearDemoRows(collection:DemoCollection) {
  if(typeof window==="undefined") return;
  window.localStorage.removeItem(keyFor(collection));
  window.dispatchEvent(new CustomEvent("binso-demo-data",{detail:{collection}}));
}
