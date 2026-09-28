import { NORMALIZED_CORE_KEYS, type State } from './shared'

export function removeNormalizedCoreFromLegacyState(state: State) {
  const legacy = { ...state }
  for (const key of NORMALIZED_CORE_KEYS) delete legacy[key]
  return legacy
}
