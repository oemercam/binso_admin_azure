/** Bounded UTF-8 CSV/TSV reader. No formula execution or silent row truncation. */
export const importLimits={rows:500,columns:32,cell:2000,bytes:3*1024*1024} as const;
export function parseDelimited(text:string,sourceRows?:number[]):string[][]{
 if(text.includes('\0'))throw new Error('invalid_csv');text=text.replace(/^\uFEFF/,'');
 let quoted=false,first='';for(let i=0;i<text.length;i++){const c=text[i];if(c==='"')quoted=!quoted;if(!quoted&&(c==='\r'||c==='\n')){if(first.replaceAll('"','').trim())break;first='';continue;}first+=quoted?'':c;}
 const delimiter=[';',',','\t'].sort((a,b)=>first.split(b).length-first.split(a).length)[0];
 const rows:string[][]=[];let row:string[]=[],cell='',inside=false,closed=false,line=1,rowStart=1;
 const endCell=()=>{if(cell.length>importLimits.cell||row.length>=importLimits.columns)throw new Error('import_limit');row.push(cell);cell='';closed=false;};
 const endRow=()=>{endCell();if(row.some(value=>value.trim())){rows.push(row);sourceRows?.push(rowStart);}row=[];if(rows.length>importLimits.rows+1)throw new Error('import_limit');};
 for(let i=0;i<text.length;i++){
  const c=text[i];if(inside){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{inside=false;closed=true;}}else{cell+=c;if(c==='\n'||c==='\r'&&text[i+1]!=='\n')line++;}}
  else if(c===delimiter)endCell();else if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;endRow();line++;rowStart=line;}
  else if(c==='"'){if(cell||closed)throw new Error('invalid_csv');inside=true;}
  else{if(closed&&c.trim())throw new Error('invalid_csv');if(!closed)cell+=c;}
  if(cell.length>importLimits.cell)throw new Error('import_limit');
 }
 if(inside)throw new Error('invalid_csv');if(cell||row.length||closed)endRow();
 if(rows.length<2)throw new Error('import_empty');const width=rows[0].length;
 if(rows.some(row=>row.length!==width))throw new Error('csv_columns');return rows;
}

export const customerImportFields=[['name','Firma',true],['contactFirstName','Vorname',true],['contactLastName','Nachname',true],['email','E-Mail',false],['phone','Telefon',false],['street','Strasse',false],['buildingNumber','Hausnummer',false],['postalCode','PLZ',false],['city','Ort',false],['uid','UID',false],['notes','Notizen',false]] as const;
export const contactImportFields=[['firstName','Vorname',true],['lastName','Nachname',true],['email','E-Mail',false],['phone','Telefon',false],['jobTitle','Position',false]] as const;
