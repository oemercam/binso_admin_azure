/** Client-side feedback only; server authorization, content validation and scanning remain mandatory. */
export function fileSelectionError(file:Pick<File,'type'|'size'>,accept:readonly string[],maxBytes:number):string|null{
 if(!accept.includes(file.type))return 'Bitte einen unterstützten Dateityp auswählen.';
 if(!Number.isFinite(file.size)||file.size<1||file.size>maxBytes)return `Die Datei muss zwischen 1 Byte und ${maxBytes/1024/1024} MB gross sein.`;
 return null;
}
