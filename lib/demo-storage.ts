export type DemoCollection = "customers" | "products" | "employees" | "expenses" | "payments";
export function appendDemoRow(collection:DemoCollection,row:string[]):never {
 void collection;void row;
 throw new Error("Die Vorschau ist schreibgeschützt. Bitte eine Datenbank-Demo starten.");
}
