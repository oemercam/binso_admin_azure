'use client'

import { useMemo, useState } from 'react'
import { customers as initialCustomers } from '@/lib/data/demo'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'

export default function CustomersPage() {
  const [customers, setCustomers] = useState(initialCustomers)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [email, setEmail] = useState('')

  const filtered = useMemo(
    () => customers.filter((customer) => `${customer.name} ${customer.contact} ${customer.email}`.toLowerCase().includes(query.toLowerCase())),
    [customers, query],
  )

  function createCustomer(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    setCustomers((current) => [
      {
        id: `demo-${Date.now()}`,
        name: name.trim(),
        contact: contact.trim(),
        email: email.trim(),
        paymentDays: 30,
        status: 'active',
      },
      ...current,
    ])
    setName('')
    setContact('')
    setEmail('')
    setOpen(false)
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="CRM"
        title="Kunden"
        description="Kontakte, Verkauf und Abrechnung zentral verwalten."
        action={<button className="button primary" onClick={() => setOpen(true)}><Icon name="plus" size={16}/> Kunde erfassen</button>}
      />

      <div className="module-toolbar">
        <label className="search-field">
          <Icon name="search" size={16}/>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kunden durchsuchen" />
        </label>
        <span className="toolbar-meta">{filtered.length} Kunden</span>
      </div>

      <div className="data-list">
        <div className="data-row customer-grid data-head">
          <span>Kunde</span><span>Kontakt</span><span>Zahlungsziel</span><span>Status</span><span />
        </div>
        {filtered.map((customer) => (
          <div className="data-row customer-grid" key={customer.id}>
            <span className="primary-cell"><strong>{customer.name}</strong><small>{customer.email || 'Keine E-Mail'}</small></span>
            <span className="primary-cell"><strong>{customer.contact || '–'}</strong><small>{customer.phone || ''}</small></span>
            <span>{customer.paymentDays} Tage</span>
            <span className="status active">Aktiv</span>
            <button className="row-link" aria-label={`${customer.name} öffnen`}><Icon name="chevron" size={15}/></button>
          </div>
        ))}
      </div>

      <div className="mobile-record-list">
        {filtered.map((customer) => (
          <article className="mobile-record" key={customer.id}>
            <div className="record-top"><span className="record-icon"><Icon name="building" size={17}/></span><span><strong>{customer.name}</strong><small>{customer.contact || 'Kein Kontakt'}</small></span><Icon name="chevron" size={15}/></div>
            <div className="record-meta"><span>{customer.email || 'Keine E-Mail'}</span><span>{customer.paymentDays} Tage</span></div>
          </article>
        ))}
      </div>

      {open && (
        <div className="overlay-layer sheet-layer" onMouseDown={() => setOpen(false)}>
          <form className="form-sheet" onSubmit={createCustomer} onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-grabber"/>
            <div className="sheet-heading"><div><strong>Kunde erfassen</strong><span>Neuer CRM-Kontakt</span></div><button type="button" className="icon-button" onClick={() => setOpen(false)}><Icon name="close" size={17}/></button></div>
            <div className="form-grid">
              <label><span>Firma *</span><input value={name} onChange={(e) => setName(e.target.value)} required /></label>
              <label><span>Ansprechperson</span><input value={contact} onChange={(e) => setContact(e.target.value)} /></label>
              <label><span>E-Mail</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
              <label><span>Zahlungsziel</span><select defaultValue="30"><option>10</option><option>20</option><option>30</option></select></label>
            </div>
            <div className="sheet-actions"><button type="button" className="button secondary" onClick={() => setOpen(false)}>Abbrechen</button><button className="button primary">Kunde speichern</button></div>
          </form>
        </div>
      )}
    </section>
  )
}
