/** Mirrors the declared CSS shell boundary; guarded by the ZIP navigation contract. */
export const desktopLayoutQuery = "(min-width:1024px)";
export function isDesktopLayout(){return window.matchMedia(desktopLayoutQuery).matches;}
