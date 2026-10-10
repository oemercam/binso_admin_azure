/** Company logos are authenticated files or local raster upload previews. */
export function companyLogoSource(value:string){
 if(/^blob:https?:\/\/[A-Za-z0-9.:\[\]-]+\/[a-fA-F0-9-]{36}$/.test(value))return value;
 const file=/^\/api\/files\/([a-fA-F0-9-]{36})\/download$/.exec(value);
 return file?`/api/files/${encodeURIComponent(file[1])}/download`:"";
}
