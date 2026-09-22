'use client'

import {
  Children,
  cloneElement,
  isValidElement,
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import { Icon } from '@/components/ui/icon'
import { ResponsiveOverlay } from '@/components/ui/responsive-overlay'
import { useDeviceEnvironment } from '@/components/providers/device-environment-provider'
import { dateFromIso, formatDate, formatMonthYear, isoFromDate, normalizeSearch } from '@/lib/format/locale'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  const { className = '', ...rest } = props
  return <input ref={ref} className={`ui-input ${className}`.trim()} {...rest} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(props, ref) {
  const { className = '', ...rest } = props
  return <textarea ref={ref} className={`ui-textarea ${className}`.trim()} {...rest} />
})

type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange'> & {
  value: string
  onValueChange: (value: string) => void
  loading?: boolean
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField({ className = '', value, onValueChange, loading = false, ...rest }, ref) {
  const hasValue = value.length > 0
  return (
    <div className={`ui-search-field ${className}`.trim()}>
      <Icon name="search" size={16} />
      <input ref={ref} type="search" value={value} onChange={(event) => onValueChange(event.target.value)} {...rest} />
      {loading ? <span className="ui-search-loading" role="status" aria-label="Suche läuft" /> : null}
      {hasValue ? (
        <button type="button" className="ui-search-clear" aria-label="Suche löschen" onClick={() => onValueChange('')}>
          <Icon name="close" size={14} />
        </button>
      ) : null}
    </div>
  )
})

export const Checkbox = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(function Checkbox({ className = '', ...props }, ref) {
  return <input ref={ref} type="checkbox" className={`ui-checkbox ${className}`.trim()} {...props} />
})

type Option = { value: string; label: string; disabled: boolean }
type SelectChangeEvent = { target: { value: string } }

type SelectProps = {
  value?: string | number
  defaultValue?: string | number
  onChange?: (event: SelectChangeEvent) => void
  children: ReactNode
  disabled?: boolean
  required?: boolean
  className?: string
  'aria-label'?: string
  title?: string
  searchable?: boolean
  searchPlaceholder?: string
}

function flattenOptions(children: ReactNode): Option[] {
  const result: Option[] = []
  Children.forEach(children, (child) => {
    if (Array.isArray(child)) {
      result.push(...flattenOptions(child))
      return
    }
    if (!isValidElement(child)) return
    if (child.type === 'option') {
      const props = (child as ReactElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>).props
      const value = props.value == null ? textFromNode(props.children) : String(props.value)
      result.push({ value, label: textFromNode(props.children), disabled: Boolean(props.disabled) })
      return
    }
    const props = child.props as { children?: ReactNode }
    if (props.children) result.push(...flattenOptions(props.children))
  })
  return result
}

function textFromNode(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textFromNode).join('')
  if (isValidElement(node)) return textFromNode((node.props as { children?: ReactNode }).children)
  return ''
}

export function Select({
  value,
  defaultValue,
  onChange,
  children,
  disabled = false,
  required = false,
  className = '',
  'aria-label': ariaLabel,
  title,
  searchable = false,
  searchPlaceholder = 'Suchen',
}: SelectProps) {
  const options = useMemo(() => flattenOptions(children), [children])
  const initialValue = value == null ? String(defaultValue ?? options[0]?.value ?? '') : String(value)
  const [uncontrolledValue, setUncontrolledValue] = useState(initialValue)
  const currentValue = value == null ? uncontrolledValue : String(value)
  const selected = options.find((option) => option.value === currentValue)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [search, setSearch] = useState('')
  const rootRef = useRef<HTMLDivElement | null>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const listboxRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const { isMobileLayout } = useDeviceEnvironment()
  const triggerId = useId()
  const listboxId = useId()

  const visibleOptions = useMemo(() => {
    const cleaned = normalizeSearch(search)
    if (!searchable || !cleaned) return options
    return options.filter((option) => normalizeSearch(option.label).includes(cleaned))
  }, [options, search, searchable])

  useEffect(() => {
    if (isMobileLayout || !open) return
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [isMobileLayout, open])

  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => {
      if (searchable && options.length > 7) searchRef.current?.focus({ preventScroll: true })
      else listboxRef.current?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [open, options.length, searchable])

  useEffect(() => {
    if (!open || activeIndex < 0) return
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  function openList() {
    const selectedIndex = visibleOptions.findIndex((option) => option.value === currentValue && !option.disabled)
    const firstEnabled = visibleOptions.findIndex((option) => !option.disabled)
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabled)
    setOpen(true)
  }

  function closeList() {
    setOpen(false)
    setSearch('')
    setActiveIndex(-1)
  }

  function choose(next: string) {
    const option = options.find((item) => item.value === next)
    if (!option || option.disabled) return
    if (value == null) setUncontrolledValue(next)
    onChange?.({ target: { value: next } })
    closeList()
  }

  function moveActive(direction: 1 | -1) {
    if (!visibleOptions.length) return
    let next = activeIndex
    for (let attempts = 0; attempts < visibleOptions.length; attempts += 1) {
      next = (next + direction + visibleOptions.length) % visibleOptions.length
      if (!visibleOptions[next]?.disabled) {
        setActiveIndex(next)
        return
      }
    }
  }

  function setBoundary(boundary: 'start' | 'end') {
    const indexes = visibleOptions.map((_, index) => index).filter((index) => !visibleOptions[index]?.disabled)
    const next = boundary === 'start' ? indexes[0] : indexes[indexes.length - 1]
    if (next != null) setActiveIndex(next)
  }

  function onTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!open) openList()
      else if (event.key === 'ArrowDown') moveActive(1)
      else if (event.key === 'ArrowUp') moveActive(-1)
      else if (activeIndex >= 0) choose(visibleOptions[activeIndex]?.value ?? currentValue)
      return
    }
    if (event.key === 'Escape') { event.preventDefault(); closeList(); return }
    if (event.key === 'Home' && open) { event.preventDefault(); setBoundary('start'); return }
    if (event.key === 'End' && open) { event.preventDefault(); setBoundary('end') }
  }

  function onListKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'ArrowDown') { event.preventDefault(); moveActive(1) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); moveActive(-1) }
    else if (event.key === 'Home') { event.preventDefault(); setBoundary('start') }
    else if (event.key === 'End') { event.preventDefault(); setBoundary('end') }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (activeIndex >= 0) choose(visibleOptions[activeIndex]?.value ?? '') }
    else if (event.key === 'Escape') { event.preventDefault(); closeList() }
  }


  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') { event.preventDefault(); moveActive(1) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); moveActive(-1) }
    else if (event.key === 'Home') { event.preventDefault(); setBoundary('start') }
    else if (event.key === 'End') { event.preventDefault(); setBoundary('end') }
    else if (event.key === 'Enter') { event.preventDefault(); if (activeIndex >= 0) choose(visibleOptions[activeIndex]?.value ?? '') }
    else if (event.key === 'Escape') { event.preventDefault(); closeList() }
  }

  const list = (
    <>
      {searchable && options.length > 7 ? <SearchField ref={searchRef} value={search} onValueChange={(value) => {
        setSearch(value)
        const query = normalizeSearch(value)
        const nextVisible = query ? options.filter((option) => normalizeSearch(option.label).includes(query)) : options
        const first = nextVisible.findIndex((option) => !option.disabled)
        setActiveIndex(first)
      }} onKeyDown={onSearchKeyDown} placeholder={searchPlaceholder} aria-label={searchPlaceholder} className="ui-select-search" /> : null}
      <div ref={listboxRef} id={listboxId} className="ui-select-options" role="listbox" aria-labelledby={triggerId} aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined} tabIndex={-1} onKeyDown={onListKeyDown}>
        {visibleOptions.map((option, index) => (
          <button
            ref={(node) => { optionRefs.current[index] = node }}
            id={`${listboxId}-option-${index}`}
            type="button"
            role="option"
            aria-selected={option.value === currentValue}
            data-active={index === activeIndex || undefined}
            className={`${option.value === currentValue ? 'ui-select-option selected' : 'ui-select-option'}${index === activeIndex ? ' active' : ''}`}
            disabled={option.disabled}
            key={`${option.value}-${option.label}`}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => choose(option.value)}
          >
            <span>{option.label}</span>
            {option.value === currentValue ? <Icon name="check" size={14} /> : null}
          </button>
        ))}
        {!visibleOptions.length ? <div className="ui-select-empty">Keine Treffer.</div> : null}
      </div>
    </>
  )

  return (
    <div ref={rootRef} className={`ui-select ${className}`.trim()}>
      <button
        id={triggerId}
        type="button"
        className="ui-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        data-required={required || undefined}
        aria-label={ariaLabel}
        title={title ?? selected?.label}
        disabled={disabled}
        onClick={() => open ? closeList() : openList()}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="ui-select-value">{selected?.label || 'Auswählen'}</span>
        <Icon name="chevron" size={15} />
      </button>

      {!isMobileLayout && open ? <div className="ui-select-popover">{list}</div> : null}
      {isMobileLayout ? (
        <ResponsiveOverlay
          open={open}
          title={ariaLabel || title || 'Auswählen'}
          onClose={closeList}
          showGrabber
          panelClassName="ui-select-sheet"
        >
          {list}
        </ResponsiveOverlay>
      ) : null}
    </div>
  )
}

type DatePickerProps = {
  value: string
  onChange: (event: { target: { value: string } }) => void
  min?: string
  max?: string
  disabled?: boolean
  required?: boolean
  className?: string
  'aria-label'?: string
  title?: string
}


export function DatePicker({ value, onChange, min, max, disabled = false, required = false, className = '', 'aria-label': ariaLabel = 'Datum auswählen', title }: DatePickerProps) {
  const { isMobileLayout } = useDeviceEnvironment()
  const [open, setOpen] = useState(false)
  const current = dateFromIso(value) ?? new Date()
  const [viewDate, setViewDate] = useState(new Date(current.getFullYear(), current.getMonth(), 1, 12))
  const [focusedDate, setFocusedDate] = useState(isoFromDate(current))
  const rootRef = useRef<HTMLDivElement | null>(null)
  const calendarRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isMobileLayout || !open) return
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeCalendar()
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [isMobileLayout, open])

  const days = useMemo(() => {
    const firstWeekday = (viewDate.getDay() + 6) % 7
    const count = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
    return Array.from({ length: firstWeekday + count }, (_, index) => index < firstWeekday ? null : new Date(viewDate.getFullYear(), viewDate.getMonth(), index - firstWeekday + 1, 12))
  }, [viewDate])

  function openCalendar() {
    const selected = dateFromIso(value) ?? new Date()
    setViewDate(new Date(selected.getFullYear(), selected.getMonth(), 1, 12))
    setFocusedDate(isoFromDate(selected))
    setOpen(true)
  }

  function closeCalendar() {
    setOpen(false)
  }

  function choose(day: Date) {
    const next = isoFromDate(day)
    if ((min && next < min) || (max && next > max)) return
    onChange({ target: { value: next } })
    closeCalendar()
  }

  function focusCalendarDate(next: Date) {
    const iso = isoFromDate(next)
    if ((min && iso < min) || (max && iso > max)) return
    setFocusedDate(iso)
    if (next.getFullYear() !== viewDate.getFullYear() || next.getMonth() !== viewDate.getMonth()) {
      setViewDate(new Date(next.getFullYear(), next.getMonth(), 1, 12))
    }
    requestAnimationFrame(() => calendarRef.current?.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)?.focus({ preventScroll: true }))
  }

  function onDayKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, day: Date) {
    let delta = 0
    if (event.key === 'ArrowRight') delta = 1
    else if (event.key === 'ArrowLeft') delta = -1
    else if (event.key === 'ArrowDown') delta = 7
    else if (event.key === 'ArrowUp') delta = -7
    else if (event.key === 'Home') delta = -((day.getDay() + 6) % 7)
    else if (event.key === 'End') delta = 6 - ((day.getDay() + 6) % 7)
    else if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault()
      const direction = event.key === 'PageUp' ? -1 : 1
      focusCalendarDate(new Date(day.getFullYear(), day.getMonth() + direction, day.getDate(), 12))
      return
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeCalendar()
      return
    } else return
    event.preventDefault()
    const next = new Date(day)
    next.setDate(next.getDate() + delta)
    focusCalendarDate(next)
  }

  const calendar = (
    <div ref={calendarRef} className="ui-calendar">
      <div className="ui-calendar-head">
        <button type="button" className="ui-calendar-nav" aria-label="Vorheriger Monat" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1, 12))}><Icon name="back" size={15} /></button>
        <strong>{formatMonthYear(isoFromDate(viewDate))}</strong>
        <button type="button" className="ui-calendar-nav next" aria-label="Nächster Monat" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1, 12))}><Icon name="chevron" size={15} /></button>
      </div>
      <div className="ui-calendar-weekdays">{['Mo','Di','Mi','Do','Fr','Sa','So'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="ui-calendar-grid">
        {days.map((day, index) => day ? (() => {
          const iso = isoFromDate(day)
          const selected = iso === value
          const today = iso === isoFromDate(new Date())
          const unavailable = Boolean((min && iso < min) || (max && iso > max))
          return <button key={iso} type="button" data-date={iso} tabIndex={iso === focusedDate ? 0 : -1} className={`ui-calendar-day${selected ? ' selected' : ''}${today ? ' today' : ''}`} disabled={unavailable} aria-label={formatDate(iso)} aria-current={today ? 'date' : undefined} aria-pressed={selected} onFocus={() => setFocusedDate(iso)} onKeyDown={(event) => onDayKeyDown(event, day)} onClick={() => choose(day)}>{day.getDate()}</button>
        })() : <span key={`blank-${index}`} className="ui-calendar-blank" />)}
      </div>
    </div>
  )

  return (
    <div ref={rootRef} className={`ui-date-picker ${className}`.trim()}>
      <button type="button" className="ui-date-trigger" aria-haspopup="dialog" aria-expanded={open} aria-label={ariaLabel} title={title ?? formatDate(value, 'Datum auswählen')} disabled={disabled} data-required={required || undefined} onClick={() => open ? closeCalendar() : openCalendar()}>
        <span>{formatDate(value, 'Datum auswählen')}</span><Icon name="calendar" size={15} />
      </button>
      {!isMobileLayout && open ? <div className="ui-date-popover">{calendar}</div> : null}
      {isMobileLayout ? <ResponsiveOverlay open={open} title={ariaLabel} onClose={closeCalendar} showGrabber panelClassName="ui-date-sheet">{calendar}</ResponsiveOverlay> : null}
    </div>
  )
}

export function FormField({
  label,
  help,
  error,
  full = false,
  children,
}: {
  label: string
  help?: string
  error?: string
  full?: boolean
  children: ReactNode
}) {
  const helpId = useId()
  const control = isValidElement(children) && (help || error)
    ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string; 'aria-invalid'?: boolean }>, {
        'aria-describedby': helpId,
        'aria-invalid': Boolean(error) || undefined,
      })
    : children

  return (
    <label className={`ui-form-field${full ? ' full' : ''}`}>
      <span className="ui-field-label">{label}</span>
      {control}
      {help || error ? <span id={helpId} className={error ? 'ui-field-error' : 'ui-field-help'}>{error || help}</span> : null}
    </label>
  )
}
