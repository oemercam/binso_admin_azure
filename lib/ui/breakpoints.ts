export const BREAKPOINTS = {
  smallMobile: 390,
  mobile: 820,
  tablet: 1024,
  desktop: 1280,
  largeDesktop: 1536,
} as const

export function isMobileWidth(width: number) {
  return width <= BREAKPOINTS.mobile
}
