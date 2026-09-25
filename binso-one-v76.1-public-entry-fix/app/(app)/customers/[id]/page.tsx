'use client'

import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useBusinessStore } from '@/components/state/business-store'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { Input, Textarea } from '@/components/ui/form-controls'
import { formatDateTime } from '@/lib/format/locale'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const store = useBusinessStore()
  const [noteOpen, setNoteOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [note, setNote] = useState('')
  const customer = store.customers.find((item) => item.id === id)

  const related = useMemo(() => ({
    quotes: store.quotes.filter((item) => item.customerId === id),
    orders: store.orders.filter((item) => item.customerId === id),
    contracts: store.contracts.filter((item) => item.customerId === id),
    invoices: store.invoices.filter((item) => item.customerId === id),
    times: store.timeEntries.filter((item) => item.customerId === id),
    activities: store.customerActivities.filter((item) => item.customerId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    contacts: store.customerContacts.filter((item) => item.customerId === id),
  }), [id, store.contracts, store.customerActivities, store.customerContacts, store.invoices, store.orders, store.quotes, store.timeEntries])

  if (!customer) return <section className="page apple-page"><PageHeader title="Kunde nicht gefunden" description="Der Datensatz ist nicht mehr vorhanden."/><button className="button secondary" onClick={() => router.push('/customers')}>Zurück zu Kunden</button></section>

  const selectedContactId = searchParams.get('contact')
  const selectedContact = related.contacts.find((item) => item.id === selectedContactId)
  const totalHours = related.times.reduce((sum, entry) => sum + entry.hours, 0)
  const relatedOrderIds = new Set(related.orders.map((order) => order.id))
  const relatedPeople = new Set(store.orderAssignmentRules.filter((rule) => rule.active && relatedOrderIds.has(rule.orderId)).map((rule) => rule.personId))

  const customerId = customer.id

  function saveNote(event: React.FormEvent) { event.preventDefault(); store.addActivityNote(customerId, note); setNote(''); setNoteOpen(false) }

  return <section className="page apple-page">
    <PageHeader title={customer.name} description={selectedContact ? `${selectedContact.name}${selectedContact.role ? ` · ${selectedContact.role}` : ''}` : 'Kontakte und gesamte Geschäftsbeziehung auf einen Blick.'} action={<button className="button secondary page-primary-action" onClick={() => router.push(`/customers?edit=${customer.id}`)}><Icon name="edit" size={16}/><span>Bearbeiten</span></button>} />

    <div className="customer-quick-actions" aria-label="Schnellaktionen">
      <Link className="button secondary" href={`/quotes?new=1&customer=${customer.id}`}><Icon name="quotes" size={15}/> Angebot</Link>
      <Link className="button secondary" href={`/orders?new=1&customer=${customer.id}`}><Icon name="orders" size={15}/> Auftrag</Link>
      <Link className="button secondary" href={`/contracts?new=1&customer=${customer.id}`}><Icon name="contracts" size={15}/> Vertrag</Link>
      <Link className="button secondary" href={`/invoices?new=1&customer=${customer.id}`}><Icon name="invoices" size={15}/> Rechnung</Link>
      <Link className="button secondary" href={`/time?new=1&customer=${customer.id}`}><Icon name="time" size={15}/> Zeit</Link>
      <button className="button secondary" onClick={() => setNoteOpen(true)}><Icon name="edit" size={15}/> Notiz</button>
    </div>

    <div className="customer-kpi-row" aria-label="Firmenkennzahlen">
      <div><span>Aufträge</span><strong>{related.orders.length}</strong></div>
      <div><span>Rechnungen</span><strong>{related.invoices.length}</strong></div>
      <div><span>Stunden</span><strong>{totalHours} h</strong></div>
    </div>

    <section className="customer-overview-section">
      <div className="section-title"><div><h2>Übersicht</h2><p>Wichtige Kundeninformationen auf einen Blick.</p></div></div>
      <div className="customer-overview-list">
        <div><span>Kundennummer</span><strong>{customer.customerNo}</strong></div>
        <div><span>Ansprechperson</span><strong>{customer.contact || related.contacts.find((item) => item.primary)?.name || '–'}</strong></div>
        <div><span>E-Mail</span><strong>{customer.email || '–'}</strong></div>
        <div><span>Telefon</span><strong>{customer.phone || '–'}</strong></div>
        <div className="customer-overview-wide"><span>Adresse</span><strong>{[customer.address, `${customer.zip || ''} ${customer.city || ''}`.trim()].filter(Boolean).join(', ') || '–'}</strong></div>
      </div>
    </section>

    <div className="customer-file-grid">
      <section className="panel"><div className="section-title"><div><h2>Kontakte</h2><p>Ansprechpersonen dieses Kunden</p></div><button className="button secondary compact-action" onClick={() => setContactOpen(true)}><Icon name="plus" size={14}/> Kontakt</button></div><div className="customer-contact-list">{related.contacts.length ? related.contacts.map((contact) => <div key={contact.id}><span><strong>{contact.name}{contact.primary ? ' · Hauptkontakt' : ''}</strong><small>{contact.role || 'Kontakt'} · {contact.email || 'keine E-Mail'}{contact.phone ? ` · ${contact.phone}` : ''}</small></span></div>) : <div className="list-empty">Keine Kontakte erfasst</div>}</div></section>

      <section className="panel"><div className="section-title"><div><h2>Bereiche</h2><p>Alle Informationen dieser Firma</p></div></div><div className="customer-linked-list">
        <Link href={`/quotes?customer=${customer.id}`}><span><strong>Angebote</strong><small>{related.quotes.length} vorhanden</small></span><Icon name="chevron" size={15}/></Link>
        <Link href={`/orders?customer=${customer.id}`}><span><strong>Aufträge</strong><small>{related.orders.length} vorhanden</small></span><Icon name="chevron" size={15}/></Link>
        <Link href={`/contracts?customer=${customer.id}`}><span><strong>Verträge</strong><small>{related.contracts.length} vorhanden</small></span><Icon name="chevron" size={15}/></Link>
        <Link href={`/invoices?customer=${customer.id}`}><span><strong>Rechnungen</strong><small>{related.invoices.length} vorhanden</small></span><Icon name="chevron" size={15}/></Link>
        <Link href={`/time?customer=${customer.id}`}><span><strong>Zeiten</strong><small>{totalHours} h erfasst</small></span><Icon name="chevron" size={15}/></Link>
        <Link href={`/employees?customer=${customer.id}`}><span><strong>Personen</strong><small>{relatedPeople.size} zugeordnet</small></span><Icon name="chevron" size={15}/></Link>
      </div></section>

      <section className="panel"><div className="section-title"><div><h2>Aktivität</h2><p>Chronologische Kundenhistorie</p></div></div><div className="customer-activity-list">
        {related.activities.slice(0, 10).map((activity) => <div key={activity.id}><span className="activity-dot"/><span><strong>{activity.title}</strong><small>{activity.detail || activity.type} · {formatDateTime(activity.createdAt)}</small></span></div>)}
        {!related.activities.length && <div className="list-empty">Keine Aktivitäten vorhanden</div>}
      </div></section>
    </div>

    {contactOpen && <ContactForm customerId={customer.id} customerName={customer.name} onClose={() => setContactOpen(false)} />}
    {noteOpen && <StandardFormSheet open title={<>Notiz erfassen</>} description={<>{customer.name}</>} onClose={() => setNoteOpen(false)} onSubmit={saveNote} formId="customer-note" footer={<><button type="button" className="button secondary" onClick={() => setNoteOpen(false)}>Abbrechen</button><button type="submit" form="customer-note" className="button primary">Notiz speichern</button></>}><label className="block-field"><span>Notiz *</span><Textarea rows={6} value={note} onChange={(e) => setNote(e.target.value)} required/></label></StandardFormSheet>}
  </section>
}


function ContactForm({ customerId, customerName, onClose }: { customerId: string; customerName: string; onClose: () => void }) {
  const store = useBusinessStore()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    const primary = !store.customerContacts.some((contact) => contact.customerId === customerId)
    store.addCustomerContact({
      id: `contact-${Date.now()}`,
      customerId,
      name: trimmedName,
      role: role.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      primary,
    })
    onClose()
  }

  return (
    <StandardFormSheet
      open
      title={<>Kontakt erfassen</>}
      description={<>{customerName}</>}
      onClose={onClose}
      onSubmit={submit}
      formId="customer-contact"
      footer={<>
        <button type="button" className="button secondary" onClick={onClose}>Abbrechen</button>
        <button type="submit" form="customer-contact" className="button primary">Kontakt speichern</button>
      </>}
    >
      <label className="block-field"><span>Name *</span><Input value={name} onChange={(event) => setName(event.target.value)} required autoFocus /></label>
      <label className="block-field"><span>Funktion</span><Input value={role} onChange={(event) => setRole(event.target.value)} placeholder="z. B. Geschäftsführung" /></label>
      <label className="block-field"><span>E-Mail</span><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label className="block-field"><span>Telefon</span><Input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
    </StandardFormSheet>
  )
}
