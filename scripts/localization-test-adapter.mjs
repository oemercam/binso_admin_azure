import React from 'react';
// Existing isolated renderer tests use the German default; localisation has a
// separate real-provider SSR and browser suite. Keep native DOM semantics here.
globalThis.LocalizedText=function LocalizedText({children}){return children};
globalThis.LocalizedElement=function LocalizedElement({as,...props}){return React.createElement(as,props)};
