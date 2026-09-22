'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { CloseButton } from '@/components/ui/close-button'
import { ResponsiveOverlay } from '@/components/ui/responsive-overlay'
import { useBusinessStore } from '@/components/state/business-store'
import type { AppUser, Role } from '@/types/domain'
import { effectiveInvoiceStatus } from '@/modules/invoices/status'
import { signOutUrl } from '@/lib/auth/urls'

const quickActions: Array<{ label: string; description: string; icon: any; href: string; roles: Role[] }> = [
  { label: 'Kunde erfassen', description: 'Firma oder Kontakt neu anlegen', icon: 'customers', href: '/customers?new=1', roles: ['owner', 'admin'] },
  { label: 'Angebot erstellen', description: 'Leistungen offerieren und versenden', icon: 'quotes', href: '/quotes?new=1', roles: ['owner', 'admin'] },
  { label: 'Auftrag erstellen', description: 'Neues Mandat oder Projekt eröffnen', icon: 'orders', href: '/orders?new=1', roles: ['owner', 'admin'] },
  { label: 'Zeit erfassen', description: 'Arbeitszeit direkt auf Auftrag buchen', icon: 'time', href: '/time?new=1', roles: ['owner', 'admin', 'employee'] },
  { label: 'Rechnung erstellen', description: 'Offene Zeiten oder freie Positionen verrechnen', icon: 'invoices', href: '/invoices?new=1', roles: ['owner', 'admin', 'finance'] },
  { label: 'Zahlung erfassen', description: 'Zahlung einer offenen Rechnung zuordnen', icon: 'credit-card', href: '/invoices?payment=1', roles: ['owner', 'admin', 'finance'] },
]

const managementRoles: Role[] = ['owner', 'admin', 'finance']

export function AppOverlays({
  user,
  searchOpen,
  setSearchOpen,
  quickOpen,
  setQuickOpen,
  profileOpen,
  setProfileOpen,
  notificationsOpen,
  setNotificationsOpen,
}: {
  user: AppUser
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  quickOpen: boolean
  setQuickOpen: (open: boolean) => void
  profileOpen: boolean
  setProfileOpen: (open: boolean) => void
  notificationsOpen: boolean
  setNotificationsOpen: (open: boolean) => void
}) {
  const store = useBusinessStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const availableQuickActions = useMemo(
    () => quickActions.filter((item) => item.roles.includes(user.role)),
    [user.role],
  )

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 40)
    else setQuery('')
  }, [searchOpen])

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
        setQuickOpen(false)
        setProfileOpen(false)
        setNotificationsOpen(false)
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setQuickOpen(false)
        setProfileOpen(false)
        setNotificationsOpen(false)
      }
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [setNotificationsOpen, setProfileOpen, setQuickOpen, setSearchOpen])

  const commandEntries = useMemo(() => {
    const management = managementRoles.includes(user.role)
    return [
      ...availableQuickActions.map((item) => ({ label: item.label, meta: 'Aktion', href: item.href, icon: item.icon })),
      ...(management ? store.customers.map((item) => ({ label: item.name, meta: `Kunde · ${item.customerNo}`, href: `/customers?edit=${item.id}`, icon: 'building' as const })) : []),
      ...store.orders.map((item) => ({ label: item.name, meta: `Auftrag · ${item.customerName}`, href: `/orders/${item.id}`, icon: 'briefcase' as const })),
      ...(management ? store.quotes.map((item) => ({ label: item.number, meta: `Angebot · ${item.customerName}`, href: `/quotes?view=${item.id}`, icon: 'quotes' as const })) : []),
      ...(management ? store.invoices.map((item) => ({ label: item.number, meta: `Rechnung · ${item.customerName}`, href: `/invoices?view=${item.id}`, icon: 'receipt' as const })) : []),
    ]
  }, [availableQuickActions, store.customers, store.invoices, store.orders, store.quotes, user.role])

  const results = useMemo(() => {
    const cleaned = query.trim().toLowerCase()
    if (!cleaned) return commandEntries.slice(0, 8)
    return commandEntries
      .filter((entry) => `${entry.label} ${entry.meta}`.toLowerCase().includes(cleaned))
      .slice(0, 12)
  }, [commandEntries, query])

  const canSeeFinance = managementRoles.includes(user.role)
  const overdue = canSeeFinance && store.appSettings.notifications.overdueInvoice
    ? store.invoices.filter((invoice) => effectiveInvoiceStatus(invoice) === 'overdue')
    : []
  const expiring = canSeeFinance && store.appSettings.notifications.expiringQuote
    ? store.quotes.filter((quote) => quote.status === 'sent')
    : []
  const unverified = user.role === 'employee'
    ? []
    : store.timeEvidence.filter((item) => item.status === 'uploaded')

  return (
    <>
      {searchOpen && (
        <div className="overlay-layer search-overlay-layer" onMouseDown={() => setSearchOpen(false)}>
          <div className="command-dialog" role="dialog" aria-modal="true" aria-label="Globale Suche" onMouseDown={(event) => event.stopPropagation()}>
            <div className="command-input">
              <Icon name="search" size={18} />
              <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Suchen oder Aktion ausführen" aria-label="Globale Suche" />
              <kbd>ESC</kbd>
            </div>
            <div className="command-results">
              <span className="command-label">{query ? 'Treffer' : 'Schnellzugriff'}</span>
              {results.map((entry) => (
                <Link key={`${entry.meta}-${entry.label}-${entry.href}`} href={entry.href} onClick={() => setSearchOpen(false)}>
                  <span className="command-icon"><Icon name={entry.icon} size={17} /></span>
                  <span><strong>{entry.label}</strong><small>{entry.meta}</small></span>
                  <Icon name="chevron" size={15} />
                </Link>
              ))}
              {!results.length && <div className="search-empty">Keine Treffer.</div>}
            </div>
          </div>
        </div>
      )}

      <ResponsiveOverlay
        open={quickOpen}
        title="Neu erstellen"
        subtitle="Direkt eine Aktion starten"
        onClose={() => setQuickOpen(false)}
        showClose
        showGrabber
        panelClassName="quick-create-sheet"
      >
        <nav className="quick-actions-list">
          {availableQuickActions.map((action) => (
            <Link key={action.label} href={action.href} onClick={() => setQuickOpen(false)}>
              <span className="quick-action-icon"><Icon name={action.icon} size={18} /></span>
              <span className="quick-action-copy"><strong>{action.label}</strong><small>{action.description}</small></span>
              <Icon name="chevron" size={15} />
            </Link>
          ))}
        </nav>
      </ResponsiveOverlay>

      {notificationsOpen && (
        <div className="profile-popover notifications-popover" role="dialog">
          <div className="popover-title"><strong>Benachrichtigungen</strong><CloseButton onClick={() => setNotificationsOpen(false)} /></div>
          <div className="notification-list">
            {overdue.map((invoice) => <Link href={`/invoices?view=${invoice.id}`} key={invoice.id} onClick={() => setNotificationsOpen(false)}><Icon name="warning" size={16} /><span><strong>{invoice.number} überfällig</strong><small>{invoice.customerName}</small></span></Link>)}
            {expiring.map((quote) => <Link href={`/quotes?view=${quote.id}`} key={quote.id} onClick={() => setNotificationsOpen(false)}><Icon name="quotes" size={16} /><span><strong>{quote.number} offen</strong><small>Gültig bis {quote.validUntil}</small></span></Link>)}
            {unverified.map((proof) => <Link href={`/orders/${proof.orderId}#evidence`} key={proof.id} onClick={() => setNotificationsOpen(false)}><Icon name="time" size={16} /><span><strong>Zeitnachweis prüfen</strong><small>{proof.fileName}</small></span></Link>)}
            {!overdue.length && !expiring.length && !unverified.length && <div className="search-empty">Keine offenen Hinweise.</div>}
          </div>
        </div>
      )}

      {profileOpen && (
        <div className="profile-popover" role="dialog">
          <div className="profile-card-head"><span className="avatar large">{initials(user.name)}</span><span><strong>{user.name}</strong><small>{roleLabel(user.role)}</small><small>{user.email}</small></span></div>
          <div className="profile-links">
            <Link href="/settings" onClick={() => setProfileOpen(false)}><Icon name="user" size={16} />Profil und Einstellungen</Link>
            <Link href="/settings" onClick={() => setProfileOpen(false)}><Icon name="bell" size={16} />Benachrichtigungen</Link>
            <a href={signOutUrl()}><Icon name="logout" size={16} />Abmelden</a>
          </div>
        </div>
      )}
    </>
  )
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'BI'
}

export function roleLabel(role: AppUser['role']) {
  if (role === 'owner') return 'Inhaber'
  if (role === 'admin') return 'Administrator'
  if (role === 'finance') return 'Buchhaltung'
  return 'Mitarbeiter'
}
