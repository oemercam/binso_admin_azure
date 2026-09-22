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

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  const { className = '', ...rest } = props
  return <input ref={ref} className={`ui-input ${className}`.trim()} {...rest} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(props, ref) {
  const { className = '', ...rest } = props
  return <textarea ref={ref} className={`ui-textarea ${className}`.trim()} {...rest} />
})

export const DatePicker = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(function DatePicker(props, ref) {
  const { className = '', ...rest } = props
  return <input ref={ref} type="date" className={`ui-input ui-date-picker ${className}`.trim()} {...rest} />
})

export const Checkbox = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(function Checkbox(props, ref) {
  const { className = '', ...rest } = props
  return <input ref={ref} type="checkbox" className={`ui-checkbox ${className}`.trim()} {...rest} />
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
}: SelectProps) {
  const options = useMemo(() => flattenOptions(children), [children])
  const initialValue = value == null ? String(defaultValue ?? options[0]?.value ?? '') : String(value)
  const [uncontrolledValue, setUncontrolledValue] = useState(initialValue)
  const currentValue = value == null ? uncontrolledValue : String(value)
  const selected = options.find((option) => option.value === currentValue)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const { isMobileLayout } = useDeviceEnvironment()
  const labelId = useId()

  useEffect(() => {
    if (isMobileLayout || !open) return
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [isMobileLayout, open])

  function choose(next: string) {
    if (value == null) setUncontrolledValue(next)
    onChange?.({ target: { value: next } })
    setOpen(false)
  }

  function onTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen(true)
    }
    if (event.key === 'Escape') setOpen(false)
    if (event.key === 'Home' && options.length) { event.preventDefault(); choose(options[0].value) }
    if (event.key === 'End' && options.length) { event.preventDefault(); choose(options[options.length - 1].value) }
  }

  const list = (
    <div className="ui-select-options" role="listbox" aria-labelledby={labelId}>
      {options.map((option) => (
        <button
          type="button"
          role="option"
          aria-selected={option.value === currentValue}
          className={option.value === currentValue ? 'ui-select-option selected' : 'ui-select-option'}
          disabled={option.disabled}
          key={`${option.value}-${option.label}`}
          onClick={() => choose(option.value)}
        >
          <span>{option.label}</span>
          {option.value === currentValue ? <Icon name="check" size={14} /> : null}
        </button>
      ))}
    </div>
  )

  return (
    <div ref={rootRef} className={`ui-select ${className}`.trim()}>
      <button
        id={labelId}
        type="button"
        className="ui-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        data-required={required || undefined}
        aria-label={ariaLabel}
        title={title ?? selected?.label}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
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
          onClose={() => setOpen(false)}
          showGrabber
          panelClassName="ui-select-sheet"
        >
          {list}
        </ResponsiveOverlay>
      ) : null}
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
