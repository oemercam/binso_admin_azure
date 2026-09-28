'use client'

import { useEffect } from 'react'
import { useLanguage } from './language-provider'
import { translateSourceText } from '@/lib/i18n/messages'

const sourceText = new WeakMap<Text, string>()
const lastTranslatedText = new WeakMap<Text, string>()
const sourceAttributes = new WeakMap<Element, Map<string, string>>()
const lastTranslatedAttributes = new WeakMap<Element, Map<string, string>>()
const ATTRIBUTES = ['aria-label', 'title', 'placeholder'] as const

function shouldSkip(node: Text) {
  const parent = node.parentElement
  if (!parent) return true
  if (parent.closest('[data-i18n-skip="true"], script, style, code, pre, kbd')) return true
  return false
}

function localizeTextNode(node: Text, locale: Parameters<typeof translateSourceText>[1]) {
  if (shouldSkip(node)) return
  const current = node.nodeValue ?? ''
  if (!current.trim()) return

  const lastTranslated = lastTranslatedText.get(node)
  if (!sourceText.has(node) || (lastTranslated !== undefined && current !== lastTranslated)) {
    sourceText.set(node, current)
  }

  const source = sourceText.get(node) ?? current
  const leading = source.match(/^\s*/)?.[0] ?? ''
  const trailing = source.match(/\s*$/)?.[0] ?? ''
  const core = source.trim()
  const next = `${leading}${translateSourceText(core, locale)}${trailing}`

  lastTranslatedText.set(node, next)
  if (next !== current) node.nodeValue = next
}

function localizeElementAttributes(element: Element, locale: Parameters<typeof translateSourceText>[1]) {
  let originals = sourceAttributes.get(element)
  if (!originals) {
    originals = new Map<string, string>()
    sourceAttributes.set(element, originals)
  }

  let lastTranslated = lastTranslatedAttributes.get(element)
  if (!lastTranslated) {
    lastTranslated = new Map<string, string>()
    lastTranslatedAttributes.set(element, lastTranslated)
  }

  for (const attribute of ATTRIBUTES) {
    const current = element.getAttribute(attribute)
    if (!current) continue

    const previousTranslation = lastTranslated.get(attribute)
    if (!originals.has(attribute) || (previousTranslation !== undefined && current !== previousTranslation)) {
      originals.set(attribute, current)
    }

    const source = originals.get(attribute) ?? current
    const next = translateSourceText(source, locale)
    lastTranslated.set(attribute, next)
    if (next !== current) element.setAttribute(attribute, next)
  }
}

function localizeTree(root: ParentNode, locale: Parameters<typeof translateSourceText>[1]) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let current: Node | null = walker.nextNode()
  while (current) {
    localizeTextNode(current as Text, locale)
    current = walker.nextNode()
  }
  if (root instanceof Element) localizeElementAttributes(root, locale)
  root.querySelectorAll?.('*').forEach((element) => localizeElementAttributes(element, locale))
}

export function DomLocalizer() {
  const { locale } = useLanguage()

  useEffect(() => {
    localizeTree(document.body, locale)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData' && mutation.target instanceof Text) {
          localizeTextNode(mutation.target, locale)
        }
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Text) localizeTextNode(node, locale)
          else if (node instanceof Element) localizeTree(node, locale)
        })
        if (mutation.type === 'attributes' && mutation.target instanceof Element) {
          localizeElementAttributes(mutation.target, locale)
        }
      }
    })
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRIBUTES],
    })
    return () => observer.disconnect()
  }, [locale])

  return null
}
