'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import { navItems } from './nav-items'
import { Icon } from '@/components/ui/icon'

const searchItems = [
  {
    label: 'Muster AG',
    meta: 'Kunde',
    href: '/customers',
  },
  {
    label: 'Tech Partner Schweiz AG',
    meta: 'Kunde',
    href: '/customers',
  },
  {
    label: 'Workplace Engineering 2026',
    meta: 'Auftrag',
    href: '/orders',
  },
  {
    label: 'Client Migration',
    meta: 'Auftrag',
    href: '/orders',
  },
  {
    label: 'RE-2026-009',
    meta: 'Rechnung',
    href: '/invoices',
  },
]

export function MobilePillNav() {
  const pathname = usePathname()

  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const cleanedQuery = query.trim().toLowerCase()

    if (cleanedQuery.length < 2) {
      return []
    }

    return searchItems.filter((item) =>
      `${item.label} ${item.meta}`
        .toLowerCase()
        .includes(cleanedQuery),
    )
  }, [query])

  function closeSearch() {
    setSearchOpen(false)
    setQuery('')
  }

  return (
    <>
      {searchOpen && (
        <div
          className="mobile-search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Suche"
        >
          <div className="search-panel">
            <div className="search-row">
              <Icon name="search" />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                autoFocus
                placeholder="Suchen…"
                aria-label="Suche"
              />

              <button
                type="button"
                onClick={closeSearch}
                aria-label="Suche schliessen"
              >
                <Icon name="close" />
              </button>
            </div>

            {query.trim().length >= 2 && (
              <div className="search-results">
                {results.length > 0 ? (
                  results.map((result) => (
                    <Link
                      key={`${result.meta}-${result.label}`}
                      href={result.href}
                      onClick={closeSearch}
                    >
                      <span>
                        <strong>
                          {result.label}
                        </strong>

                        <small>
                          {result.meta}
                        </small>
                      </span>

                      <Icon
                        name="chevron"
                        size={16}
                      />
                    </Link>
                  ))
                ) : (
                  <div className="search-empty">
                    Keine Treffer
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {open && (
        <div
          className="sheet-backdrop"
          onClick={() => setOpen(false)}
        >
          <div
            className="mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="grabber" />

            <div className="sheet-title">
              <span>Navigation</span>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Menü schliessen"
              >
                <Icon name="close" />
              </button>
            </div>

            <nav>
              {navItems.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(
                    `${item.href}/`,
                  )

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      active
                        ? 'active'
                        : undefined
                    }
                    onClick={() =>
                      setOpen(false)
                    }
                  >
                    <Icon name={item.icon} />

                    <strong>
                      {item.label}
                    </strong>

                    <Icon
                      name="chevron"
                      size={16}
                    />
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      <div
        className="mobile-pill"
        aria-label="Mobile Navigation"
      >
        <button
          type="button"
          onClick={() =>
            setSearchOpen(true)
          }
          aria-label="Suche öffnen"
        >
          <Icon name="search" />
          <span>Suche</span>
        </button>

        <span className="pill-divider" />

        <button
          type="button"
          onClick={() =>
            setOpen(true)
          }
          aria-label="Menü öffnen"
        >
          <span>Menü</span>
          <Icon name="menu" />
        </button>
      </div>
    </>
  )
}
