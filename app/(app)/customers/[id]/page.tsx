'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useBusinessStore } from '@/components/state/business-store'
import { PageHeader } from '@/components/ui/page-header'
import { Icon } from '@/components/ui/icon'
import { StandardFormSheet } from '@/components/ui/sheet-system'
import { Input, Textarea } from '@/components/ui/form-controls'
import { formatChf, formatDateTime } from '@/lib/format/locale'
const chf = (value: number) => formatChf(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
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
    activities: store.customerActivities.filter((item) => item.customerId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    contacts: store.customerContacts.filter((item) => item.customerId === id),
  }), [id, store.contracts, store.customerActivities, store.customerContacts, store.invoices, store.orders, store.quotes])

  if (!customer) return <section className="page"><PageHeader eyebrow="CRM" title="Kunde nicht gefunden" description="Der Datensatz ist nicht mehr vorhanden."/><button className="button secondary" onClick={() => router.push('/customers')}>Zurück zu Kunden</button></section>

  const customerId = customer.id
  const openAmount = related.invoices.reduce((sum, invoice) => sum + Math.max(0, invoice.amount - invoice.paidAmount - (invoice.creditedAmount ?? 0)), 0)

  function saveNote(event: React.FormEvent) { event.preventDefault(); store.addActivityNote(customerId, note); setNote(''); setNoteOpen(false) }

  return <section className="page">
    <PageHeader eyebrow="KUNDENAKTE" title={customer.name} description={`${customer.customerNo} · ${customer.contact || 'Keine Ansprechperson'} · ${customer.email || 'Keine E-Mail'}`} action={<button className="button secondary page-primary-action" onClick={() => router.push(`/customers?edit=${customer.id}`)}><Icon name="edit" size={16}/><span>Bearbeiten</span></button>} />

    <div className="customer-quick-actions" aria-label="Schnellaktionen">
      <Link className="button secondary" href={`/quotes?new=1&customer=${customer.id}`}><Icon name="quotes" size={15}/> Angebot</Link>
      <Link className="button secondary" href={`/orders?new=1&customer=${customer.id}`}><Icon name="orders" size={15}/> Auftrag</Link>
      <Link className="button secondary" href={`/contracts?new=1&customer=${customer.id}`}><Icon name="contracts" size={15}/> Vertrag</Link>
      <Link className="button secondary" href={`/invoices?new=1&customer=${customer.id}`}><Icon name="invoices" size={15}/> Rechnung</Link>
      <Link className="button secondary" href={`/time?new=1&customer=${customer.id}`}><Icon name="time" size={15}/> Zeit</Link>
      <button className="button secondary" onClick={() => setContactOpen(true)}><Icon name="user" size={15}/> Kontakt</button><button className="button secondary" onClick={() => setNoteOpen(true)}><Icon name="edit" size={15}/> Notiz</button>
    </div>

    <div className="metric-grid compact-metrics">
      <div className="metric"><span>Angebote</span><strong>{related.quotes.length}</strong><small>{related.quotes.filter((item) => item.status === 'sent').length} offen</small></div>
      <div className="metric"><span>Aufträge</span><strong>{related.orders.length}</strong><small>{related.orders.filter((item) => item.status === 'active').length} aktiv</small></div>
      <div className="metric"><span>Verträge</span><strong>{related.contracts.length}</strong><small>{related.contracts.filter((item) => item.status === 'active').length} aktiv</small></div>
      <div className="metric"><span>Offener Betrag</span><strong>{chf(openAmount)}</strong><small>Rechnungen abzüglich Zahlungen/Gutschriften</small></div>
    </div>

    <div className="customer-file-grid">
      <section className="panel"><div className="section-title"><div><h2>Kontakte</h2><p>Ansprechpersonen dieses Kunden</p></div><button className="button secondary compact-action" onClick={() => setContactOpen(true)}><Icon name="plus" size={14}/> Kontakt</button></div><div className="customer-contact-list">{related.contacts.length ? related.contacts.map((contact) => <div key={contact.id}><span><strong>{contact.name}{contact.primary ? ' · Hauptkontakt' : ''}</strong><small>{contact.role || 'Kontakt'} · {contact.email || 'keine E-Mail'}{contact.phone ? ` · ${contact.phone}` : ''}</small></span></div>) : <div className="search-empty">Noch keine Kontakte.</div>}</div></section>

      <section className="panel"><div className="section-title"><div><h2>Geschäftsvorgänge</h2><p>Vom Angebot bis zur Rechnung</p></div></div><div className="customer-linked-list">
        {related.quotes.slice(0, 4).map((quote) => <Link key={quote.id} href={`/quotes?view=${quote.id}`}><span><strong>{quote.number}</strong><small>Angebot · {quote.title}</small></span><span>{quote.status === 'accepted' ? 'Angenommen' : quote.status === 'declined' ? 'Abgelehnt' : quote.status === 'sent' ? 'Versendet' : quote.status === 'revised' ? 'Ersetzt' : 'Entwurf'}</span></Link>)}
        {related.orders.slice(0, 4).map((order) => <Link key={order.id} href={`/orders/${order.id}`}><span><strong>{order.name}</strong><small>Auftrag</small></span><span>{order.status === 'active' ? 'Aktiv' : order.status === 'completed' ? 'Abgeschlossen' : 'Pausiert'}</span></Link>)}
        {related.contracts.slice(0, 4).map((contract) => <Link key={contract.id} href="/contracts"><span><strong>{contract.number}</strong><small>Vertrag · {contract.name}</small></span><span>{contract.status === 'active' ? 'Aktiv' : 'Inaktiv'}</span></Link>)}
        {related.invoices.slice(0, 4).map((invoice) => <Link key={invoice.id} href={`/invoices?view=${invoice.id}`}><span><strong>{invoice.number}</strong><small>Rechnung · {invoice.period}</small></span><span>{chf(invoice.amount)}</span></Link>)}
        {!related.quotes.length && !related.orders.length && !related.contracts.length && !related.invoices.length && <div className="search-empty">Noch keine Vorgänge.</div>}
      </div></section>

      <section className="panel"><div className="section-title"><div><h2>Aktivität</h2><p>Chronologische Kundenhistorie</p></div></div><div className="customer-activity-list">
        {related.activities.slice(0, 10).map((activity) => <div key={activity.id}><span className="activity-dot"/><span><strong>{activity.title}</strong><small>{activity.detail || activity.type} · {formatDateTime(activity.createdAt)}</small></span></div>)}
        {!related.activities.length && <div className="search-empty">Noch keine Aktivitäten.</div>}
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
