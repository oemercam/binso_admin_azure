declare namespace JSX { interface IntrinsicElements { [elemName: string]: any } }
declare namespace React { type ReactNode = any; type FormEvent<T = any> = any }
declare var process: { env: Record<string, string | undefined> }
declare var Buffer: { from(value: string, encoding?: string): { toString(encoding?: string): string } }
declare module 'server-only' {}
declare module 'react' {
  export type ReactNode = any
  export type FormEvent<T = any> = any
  export type SVGProps<T> = any
  export type Context<T> = { __type?: T; Provider: any }
  export function useState<T>(initial: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void]
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void
  export function useMemo<T>(factory: () => T, deps: any[]): T
  export function useRef<T>(initial: T): { current: T }
  export function createContext<T>(value: T): Context<T>
  export function useContext<T>(ctx: Context<T>): T
}
declare module 'react/jsx-runtime' { export const jsx: any; export const jsxs: any; export const Fragment: any }
declare module 'next/link' { const Link: any; export default Link }
declare module 'next/navigation' {
  export function redirect(path: string): never
  export function notFound(): never
  export function usePathname(): string
  export function useRouter(): { push(path: string): void; replace(path: string, options?: any): void }
  export function useSearchParams(): { get(name: string): string | null; has(name: string): boolean; toString(): string }
  export function useParams<T = any>(): T
}
declare module 'next/server' {
  export const NextResponse: { json(value: any, init?: any): any }
}
declare module 'next/headers' { export function headers(): Promise<{ get(name: string): string | null }> }
declare module 'next' {
  export type Metadata = any
  export type Viewport = any
  export namespace MetadataRoute { type Manifest = any }
}
