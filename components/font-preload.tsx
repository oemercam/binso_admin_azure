/** Match the one self-hosted face exactly; optional display still permits a
 * stable system fallback when the font is genuinely slow or unavailable. */
export function FontPreload(){
 return <link rel="preload" href="/fonts/inter/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/>;
}
