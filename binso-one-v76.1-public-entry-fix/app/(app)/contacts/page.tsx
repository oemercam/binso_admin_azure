'use client'

import { useMemo, useState } from 'react'
import { Input, Select } from '@/components/ui/form-controls'
import { InteractiveRow } from '@/components/ui/interactive-row'
import { PageHeader } from '@/components/ui/page-header'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { Icon } from '@/components/ui/icon'
import { useBusinessStore } from '@/components/state/business-store'
import { useFeedback } from '@/components/ui/feedback'

export default function ContactsPage() {
  const store = useBusinessStore()
  const feedback = useFeedback()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [customerId, setCustomerId] = useState(store.customers[0]?.id ?? '')
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const contacts = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return store.customerContacts
      .map((contact) => ({
        ...contact,
        company: store.customers.find((customer) => customer.id === contact.customerId),
      }))
      .filter((contact) => contact.company)
      .filter((contact) => {
        if (!normalized) return true
        return [
          contact.name,
          contact.role,
          contact.email,
          contact.phone,
          contact.company?.name,
        ].some((value) => value?.toLowerCase().includes(normalized))
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'de-CH'))
  }, [query, store.customerContacts, store.customers])

  function save(event: React.FormEvent) {
    event.preventDefault()
    const customer = store.customers.find((item) => item.id === customerId)
    const trimmedName = name.trim()
    if (!customer || !trimmedName) return

    const primary = !store.customerContacts.some((contact) => contact.customerId === customer.id)
    store.addCustomerContact({
      id: `contact-${Date.now()}`,
      customerId: customer.id,
      name: trimmedName,
      role: role.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      primary,
    })

    setName('')
    setRole('')
    setEmail('')
    setPhone('')
    setOpen(false)
    feedback.success(`Kontakt ${trimmedName} wurde erfasst.`)
  }

  return (
    <section className="page apple-page mobile-standard-page">
      <PageHeader
        title="Kontakte"
        description="Ansprechpersonen finden und direkt zur zugehörigen Firma wechseln."
        action={<button className="button primary page-primary-action" onClick={() => setOpen(true)}><Icon name="plus" size={16}/><span>Kontakt erfassen</span></button>}
      />

      <div className="module-toolbar">
        <label className="search-field"><Icon name="search" size={16}/><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kontakte oder Firmen durchsuchen" /></label>
        <span className="toolbar-meta">{contacts.length} Kontakte</span>
      </div>

      <div className="data-list compact-overview-list">
        <div className="data-row contact-grid data-head"><span>Kontakt</span><span>Firma</span><span /></div>
        {contacts.map((contact) => (
          <InteractiveRow
            className="data-row contact-grid compact-overview-row"
            key={contact.id}
            href={`/customers/${contact.customerId}?contact=${contact.id}`}
            ariaLabel={`${contact.name} bei ${contact.company?.name} öffnen`}
          >
            <span className="primary-cell">
              <strong>{contact.name}</strong>
              <small className="desktop-row-detail">{contact.role || contact.email || 'Kontakt'}</small>
              <small className="mobile-row-summary">{contact.company?.name}</small>
            </span>
            <span className="overview-desktop-cell">
              <strong>{contact.company?.name}</strong>
              <small>{contact.role || contact.email || 'Kontakt'}</small>
            </span>
            <span className="row-disclosure" aria-hidden="true"><Icon name="chevron" size={15}/></span>
          </InteractiveRow>
        ))}
        {!contacts.length && <div className="list-empty">Keine Kontakte gefunden</div>}
      </div>

      {open && (
        <StandardFormSheet
          open
          title={<>Kontakt erfassen</>}
          description={<>Kontakt einer Firma zuordnen.</>}
          onClose={() => setOpen(false)}
          onSubmit={save}
          formId="contacts-page-sheet"
          footer={<><button type="button" className="button secondary" onClick={() => setOpen(false)}>Abbrechen</button><button type="submit" form="contacts-page-sheet" className="button primary">Kontakt speichern</button></>}
        >
          <div className="form-grid">
            <label className="full"><span>Firma *</span><Select value={customerId} onChange={(event) => setCustomerId(event.target.value)} required>{store.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</Select></label>
            <label><span>Name *</span><Input value={name} onChange={(event) => setName(event.target.value)} required autoFocus /></label>
            <label><span>Funktion</span><Input value={role} onChange={(event) => setRole(event.target.value)} placeholder="z. B. IT-Leitung" /></label>
            <label><span>E-Mail</span><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label><span>Telefon</span><Input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
          </div>
        </StandardFormSheet>
      )}
    </section>
  )
}
