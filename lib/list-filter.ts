/** Match visible entity types and status groups without coupling them to routes. */
export function matchesRecordChip(chip:string,status:string,type:string,groups:Record<string,string[]>={}){
 const singular=(value:string)=>value.toLocaleLowerCase('de-CH').replace(/(?:en|e)$/,'');
 return chip==='Alle'||status===chip||!!groups[chip]?.includes(status)||!!type&&singular(type)===singular(chip);
}

/** Drilldowns may select only an existing domain filter, never arbitrary state. */
export function listStatusOverride(search:string,chips:readonly string[]){
 const value=new URLSearchParams(search).get('status');
 return value&&chips.includes(value)?value:undefined;
}
