/** Private search text stays in page memory; never persist it in browser storage. */
export const listStateStore=new Map<string,string>();
export function clearListState(){listStateStore.clear();}
