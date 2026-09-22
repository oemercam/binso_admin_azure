# Binso Admin V20 – ESLint set-state-in-effect fix

Patch for the 12 `react-hooks/set-state-in-effect` errors reported by ESLint.

Copy these files over the existing repository, then run:

```powershell
npm run typecheck
npm run lint
npm run build
```

The patch intentionally does not contain `package-lock.json`, `next-env.d.ts` or `tsconfig.json`, so the current locally generated/committed versions remain untouched.
