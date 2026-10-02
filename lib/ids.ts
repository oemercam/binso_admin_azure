export function slugify(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("de-CH")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/&/g," und ")
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"");
}
