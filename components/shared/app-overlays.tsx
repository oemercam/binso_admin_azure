'use client'

import { SearchField } from '@/components/ui/form-controls'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { CloseButton } from '@/components/ui/close-button'
import { ResponsiveOverlay } from '@/components/ui/responsive-overlay'
import { useBusinessStore } from '@/components/state/business-store'
import type { AppUser } from '@/types/domain'
import { quickActionsForRole } from '@/components/navigation/action-items'
import { roleLabel } from '@/lib/auth/labels'
import { effectiveInvoiceStatus } from '@/modules/invoices/status'
import { signOutUrl } from '@/lib/auth/urls'
import { navForRole } from '@/components/navigation/nav-items'
import { formatDate, normalizeSearch } from '@/lib/format/locale'
import { canManageOperations, canViewManagementData } from '@/lib/auth/capabilities'


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
    () => quickActionsForRole(user.role),
    [user.role],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchOpen) inputRef.current?.focus()
      else setQuery('')
    }, searchOpen ? 40 : 0)
    return () => window.clearTimeout(timer)
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
    const management = canViewManagementData(user.role)
    const currentEmployee = store.employees.find((item) => item.email.toLowerCase() === user.email.toLowerCase())
    const assignedOrderIds = new Set(
      store.orderAssignmentRules
        .filter((rule) => rule.active && currentEmployee && rule.personId === currentEmployee.id)
        .map((rule) => rule.orderId),
    )
    const visibleOrders = user.role === 'employee'
      ? store.orders.filter((order) => assignedOrderIds.has(order.id))
      : store.orders

    return [
      ...navForRole(user.role).map((item) => ({ label: item.label, meta: 'Navigation', href: item.href, icon: item.icon })),
      ...availableQuickActions.map((item) => ({ label: item.label, meta: 'Aktion', href: item.href, icon: item.icon })),
      ...(management ? store.customers.map((item) => ({ label: item.name, meta: `Kunde · ${item.customerNo}`, href: `/customers?edit=${item.id}`, icon: 'building' as const })) : []),
      ...visibleOrders.map((item) => ({ label: item.name, meta: `Auftrag · ${item.customerName}`, href: `/orders/${item.id}`, icon: 'briefcase' as const })),
      ...(management ? store.quotes.map((item) => ({ label: item.number, meta: `Angebot · ${item.customerName}`, href: `/quotes?view=${item.id}`, icon: 'quotes' as const })) : []),
      ...(management ? store.invoices.map((item) => ({ label: item.number, meta: `Rechnung · ${item.customerName}`, href: `/invoices?view=${item.id}`, icon: 'receipt' as const })) : []),
      ...(canManageOperations(user.role)
        ? store.employees.map((item) => ({ label: item.name, meta: `Mitarbeitende · ${item.email}`, href: '/employees', icon: 'employees' as const }))
        : []),
    ]
  }, [availableQuickActions, store.customers, store.employees, store.invoices, store.orderAssignmentRules, store.orders, store.quotes, user.email, user.role])

  const results = useMemo(() => {
    const cleaned = normalizeSearch(query)
    if (!cleaned) return commandEntries.slice(0, 8)
    return commandEntries
      .filter((entry) => normalizeSearch(`${entry.label} ${entry.meta}`).includes(cleaned))
      .slice(0, 12)
  }, [commandEntries, query])

  const canSeeFinance = canViewManagementData(user.role)
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
      <ResponsiveOverlay
        open={searchOpen}
        title="Globale Suche"
        description="Suchen oder Aktion ausführen"
        onClose={() => setSearchOpen(false)}
        mobile="bottom"
        desktop="dialog"
        showGrabber={false}
      >
        <div className="command-input"><SearchField ref={inputRef} value={query} onValueChange={setQuery} placeholder="Suchen oder Aktion ausführen" aria-label="Globale Suche" /><kbd>ESC</kbd></div>
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
      </ResponsiveOverlay>

      <ResponsiveOverlay
        open={quickOpen}
        title="Neu erstellen"
        description="Direkt eine Aktion starten"
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
            {expiring.map((quote) => <Link href={`/quotes?view=${quote.id}`} key={quote.id} onClick={() => setNotificationsOpen(false)}><Icon name="quotes" size={16} /><span><strong>{quote.number} offen</strong><small>Gültig bis {formatDate(quote.validUntil)}</small></span></Link>)}
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
