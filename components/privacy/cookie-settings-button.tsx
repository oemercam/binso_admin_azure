"use client";
export default function CookieSettingsButton(){return <button className="secondary-button" onClick={()=>window.dispatchEvent(new Event("binso-open-consent"))}>Cookie-Einstellungen öffnen</button>}
