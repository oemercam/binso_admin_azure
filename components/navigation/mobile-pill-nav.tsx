'use client'
import Link from 'next/link'
import { useState } from 'react'
import { navItems } from './nav-items'

export function MobilePillNav() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(false)
  return <>
    {search && <div className="mobile-search-overlay" role="dialog" aria-modal="true"><div className="search-panel"><div className="search-row"><span>⌕</span><input autoFocus placeholder="Kunden, Aufträge, Rechnungen suchen…" /><button onClick={() => setSearch(false)}>Schliessen</button></div><p className="muted">Die globale Suche wird mit dem Datenbankmodul verbunden.</p></div></div>}
    {open && <div className="sheet-backdrop" onClick={() => setOpen(false)}><div className="mobile-sheet" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}><div className="grabber"/><nav>{navItems.map(i => <Link onClick={() => setOpen(false)} key={i.href} href={i.href}><span>{i.icon}</span><strong>{i.label}</strong><span>›</span></Link>)}</nav></div></div>}
    <div className="mobile-pill" aria-label="Mobile Navigation">
      <button onClick={() => setSearch(true)} aria-label="Suche öffnen"><span aria-hidden>⌕</span><span>Suche</span></button>
      <span className="pill-divider" />
      <button onClick={() => setOpen(true)} aria-label="Menü öffnen"><span>Menü</span><span aria-hidden>☰</span></button>
    </div>
  </>
}
