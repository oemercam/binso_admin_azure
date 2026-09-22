export type BrowserStorageKind = 'local' | 'session'

function getStorage(kind: BrowserStorageKind): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function readStorage(key: string, kind: BrowserStorageKind = 'local') {
  try {
    return getStorage(kind)?.getItem(key) ?? null
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string, kind: BrowserStorageKind = 'local') {
  try {
    getStorage(kind)?.setItem(key, value)
  } catch {
    // Browser storage is a progressive enhancement only.
  }
}

export function removeStorage(key: string, kind: BrowserStorageKind = 'local') {
  try {
    getStorage(kind)?.removeItem(key)
  } catch {
    // Browser storage is a progressive enhancement only.
  }
}
