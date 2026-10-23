/** A persisted language may appear in history without changing the destination.
 * Keep origin, path, fragment and all non-language query requirements exact. */
export function matchesLocalizedRoute(actual,expected,locale){
 const current=new URL(actual),target=new URL(expected);
 if(current.origin!==target.origin||current.pathname!==target.pathname||current.hash!==target.hash)return false;
 const language=current.searchParams.getAll('lang');
 if(language.length>1||language.length===1&&language[0]!==locale)return false;
 current.searchParams.delete('lang');target.searchParams.delete('lang');
 current.searchParams.sort();target.searchParams.sort();
 return current.search===target.search;
}
export function waitForLocalizedRoute(page,expected,locale='de'){
 return page.waitForURL(url=>matchesLocalizedRoute(url,expected,locale));
}
