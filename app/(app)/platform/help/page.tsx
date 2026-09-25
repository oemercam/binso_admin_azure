'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Input, Select, Textarea } from '@/components/ui/form-controls'
import { StatusBadge } from '@/components/ui/status-badge'
import { useFeedback } from '@/components/ui/feedback'
import { apiRequest, jsonBody } from '@/lib/http/api-client'
import type { PlatformHelpArticle } from '@/lib/db/repositories/help-center'

type Category = { id: string; slug: string; title: string }
type ResponseData = { articles: PlatformHelpArticle[]; categories: Category[]; canManage: boolean }

export default function PlatformHelpPage() {
  const feedback = useFeedback()
  const [data, setData] = useState<ResponseData>({ articles: [], categories: [], canManage: false })
  const [selected, setSelected] = useState<PlatformHelpArticle | null>(null)
  const [creating, setCreating] = useState(false)
  const [query, setQuery] = useState('')
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [body, setBody] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [keywords, setKeywords] = useState('')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try { setData(await apiRequest<ResponseData>('/api/platform/help')) }
    catch (error) { feedback.error(error instanceof Error ? error.message : 'Help Center konnte nicht geladen werden.') }
  }, [feedback])
  useEffect(() => { queueMicrotask(() => { void load() }) }, [load])
  const filtered = useMemo(() => data.articles.filter((item) => `${item.title} ${item.slug} ${item.categoryTitle ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())), [data.articles, query])

  function open(item: PlatformHelpArticle) { setSelected(item); setCreating(false); setSlug(item.slug); setTitle(item.title); setSummary(item.summary ?? ''); setBody(item.body); setCategoryId(item.categoryId ?? ''); setKeywords(item.keywords.join(', ')); setPublished(item.published) }
  function create() { setSelected(null); setCreating(true); setSlug(''); setTitle(''); setSummary(''); setBody(''); setCategoryId(data.categories[0]?.id ?? ''); setKeywords(''); setPublished(false) }
  function close() { setSelected(null); setCreating(false) }

  async function save() {
    if (!data.canManage || saving) return
    setSaving(true)
    try {
      await apiRequest('/api/platform/help', { method: 'PUT', body: jsonBody({ id: selected?.id, slug, title, summary, body, categoryId: categoryId || undefined, keywords: keywords.split(',').map((item) => item.trim()).filter(Boolean), published }) })
      feedback.success('Artikel wurde gespeichert.')
      await load(); close()
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Artikel konnte nicht gespeichert werden.')
    } finally { setSaving(false) }
  }

  return <section className="page apple-page"><PageHeader title="Help Center" description="Artikel, Kategorien und Hilfreich-Feedback für die digitale Kundenhilfe." /><div className="module-toolbar"><label className="search-field"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Artikel suchen" /></label>{data.canManage ? <button type="button" className="button primary" onClick={create}>Neuer Artikel</button> : null}</div><div className="data-list compact-overview-list">{filtered.map((item) => <button type="button" className="data-row compact-overview-row" key={item.id} onClick={() => open(item)}><span className="primary-cell"><strong>{item.title}</strong><small>{item.categoryTitle ?? 'Ohne Kategorie'} · /help/{item.slug}</small></span><StatusBadge status={item.published ? 'published' : 'draft'} label={item.published ? 'Publiziert' : 'Entwurf'} /><span>{item.helpful} hilfreich · {item.notHelpful} nicht hilfreich</span><span className="row-disclosure">›</span></button>)}</div>{(selected || creating) ? <div className="settings-section"><h2>{creating ? 'Neuer Artikel' : selected?.title}</h2><label><span>Titel</span><Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} /></label><label><span>Slug</span><Input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} placeholder="erster-kunde-erfassen" /></label><label><span>Kategorie</span><Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Ohne Kategorie</option>{data.categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}</Select></label><label><span>Zusammenfassung</span><Textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={2} /></label><label><span>Inhalt</span><Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={10} /></label><label><span>Keywords</span><Input value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="kunden, erfassen, erste schritte" /></label><label><span>Status</span><Select value={published ? 'published' : 'draft'} onChange={(event) => setPublished(event.target.value === 'published')}><option value="draft">Entwurf</option><option value="published">Publiziert</option></Select></label><div className="module-toolbar"><button type="button" className="button secondary" onClick={close}>Schliessen</button>{data.canManage ? <button type="button" className="button primary" disabled={saving} onClick={() => void save()}>{saving ? 'Speichern…' : 'Speichern'}</button> : null}</div></div> : null}</section>
}
