import fs from 'node:fs/promises';
/** Static regression tests follow the actual domain implementations, not the compatibility barrel. */
export async function readPageFile(file,encoding='utf8'){
 if(file!=='components/app-pages.tsx')return fs.readFile(file,encoding);
 const files=(await fs.readdir('components/pages')).filter(file=>file.endsWith('.tsx')).sort();
 return (await Promise.all(files.map(file=>fs.readFile('components/pages/'+file,encoding)))).join('\n');
}
