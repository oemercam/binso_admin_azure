'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import type { AppUser } from '@/types/domain'

const commandEntries = [
  { label: 'Kunde erfassen', meta: 'Aktion', href: '/customers?new=1', icon: 'customers' as const },
  { label: 'Angebot erstellen', meta: 'Aktion', href: '/quotes?new=1', icon: 'quotes' as const },
  { label: 'Zeit erfassen', meta: 'Aktion', href: '/time?new=1', icon: 'time' as const },
  { label: 'Rechnung erstellen', meta: 'Aktion', href: '/invoices?new=1', icon: 'invoices' as const },
  { label: 'Muster AG', meta: 'Kunde', href: '/customers', icon: 'building' as const },
  { label: 'Workplace Engineering 2026', meta: 'Auftrag', href: '/orders', icon: 'briefcase' as const },
  { label: 'RE-2026-009', meta: 'Rechnung', href: '/invoices', icon: 'receipt' as const },
]

export function AppOverlays({
  user,
  searchOpen,
  setSearchOpen,
  quickOpen,
  setQuickOpen,
  profileOpen,
  setProfileOpen,
}: {
  user: AppUser
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  quickOpen: boolean
  setQuickOpen: (open: boolean) => void
  profileOpen: boolean
  setProfileOpen: (open: boolean) => void
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 40)
    } else {
      setQuery('')
    }
  }, [searchOpen])

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }

      if (event.key === 'Escape') {
        setSearchOpen(false)
        setQuickOpen(false)
        setProfileOpen(false)
      }
    }

    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [setProfileOpen, setQuickOpen, setSearchOpen])

  const results = useMemo(() => {
    const cleaned = query.trim().toLowerCase()
    if (!cleaned) return commandEntries.slice(0, 5)

    return commandEntries.filter((entry) =>
      `${entry.label} ${entry.meta}`.toLowerCase().includes(cleaned),
    )
  }, [query])

  return (
    <>
      {searchOpen && (
        <div className="overlay-layer" onMouseDown={() => setSearchOpen(false)}>
          <div className="command-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="command-input">
              <Icon name="search" size={18} />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Suchen oder Aktion ausführen"
                aria-label="Globale Suche"
              />
              <kbd>ESC</kbd>
            </div>

            <div className="command-results">
              <span className="command-label">{query ? 'Treffer' : 'Schnellzugriff'}</span>
              {results.map((entry) => (
                <Link key={`${entry.meta}-${entry.label}`} href={entry.href} onClick={() => setSearchOpen(false)}>
                  <span className="command-icon"><Icon name={entry.icon} size={17} /></span>
                  <span>
                    <strong>{entry.label}</strong>
                    <small>{entry.meta}</small>
                  </span>
                  <Icon name="chevron" size={15} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {quickOpen && (
        <div className="overlay-layer sheet-layer" onMouseDown={() => setQuickOpen(false)}>
          <div className="action-sheet" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-grabber" />
            <div className="sheet-heading">
              <div>
                <strong>Neu erstellen</strong>
                <span>Was möchtest du erfassen?</span>
              </div>
              <button className="icon-button" onClick={() => setQuickOpen(false)} aria-label="Schliessen">
                <Icon name="close" size={17} />
              </button>
            </div>

            <div className="quick-actions-grid">
              {([
                { label: 'Kunde', icon: 'customers', href: '/customers?new=1' },
                { label: 'Angebot', icon: 'quotes', href: '/quotes?new=1' },
                { label: 'Auftrag', icon: 'orders', href: '/orders?new=1' },
                { label: 'Zeit', icon: 'time', href: '/time?new=1' },
                { label: 'Rechnung', icon: 'invoices', href: '/invoices?new=1' },
                { label: 'Zahlung', icon: 'credit-card', href: '/invoices?payment=1' },
              ] as const).map((action) => (
                <Link key={action.label} href={action.href} onClick={() => setQuickOpen(false)}>
                  <span><Icon name={action.icon} size={19} /></span>
                  <strong>{action.label}</strong>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {profileOpen && (
        <div className="profile-popover" role="dialog">
          <div className="profile-card-head">
            <span className="avatar large">{initials(user.name)}</span>
            <span>
              <strong>{user.name}</strong>
              <small>{roleLabel(user.role)}</small>
              <small>{user.email}</small>
            </span>
          </div>

          <div className="profile-links">
            <Link href="/settings" onClick={() => setProfileOpen(false)}>
              <Icon name="user" size={16} />
              Profil und Einstellungen
            </Link>
            <Link href="/settings" onClick={() => setProfileOpen(false)}>
              <Icon name="bell" size={16} />
              Benachrichtigungen
            </Link>
            <a href="/.auth/logout?post_logout_redirect_uri=/sign-in">
              <Icon name="logout" size={16} />
              Abmelden
            </a>
          </div>
        </div>
      )}
    </>
  )
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'BI'
  )
}

export function roleLabel(role: AppUser['role']) {
  if (role === 'owner') return 'Inhaber'
  if (role === 'admin') return 'Administrator'
  if (role === 'finance') return 'Buchhaltung'
  return 'Mitarbeiter'
}
