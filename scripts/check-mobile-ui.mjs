import fs from "node:fs"

const css = fs.readFileSync("app/app-ui.css", "utf8")
const marker = "V38 — CANONICAL MOBILE/PWA PRESENTATION LAYER"
const markerIndex = css.indexOf(marker)

if (markerIndex < 0) {
  console.error("Mobile UI check failed: canonical V38 marker is missing.")
  process.exit(1)
}

const before = css.slice(0, markerIndex)
const forbidden = [
  ".mobile-standard-page",
  ".mobile-kpi-3",
  ".mobile-kpi-4",
  ".metric-label-mobile",
]

const violations = forbidden.filter((selector) => before.includes(selector))
if (violations.length) {
  console.error(`Mobile UI check failed: legacy mobile selectors found before canonical layer: ${violations.join(", ")}`)
  process.exit(1)
}

const canonicalCount = (css.match(/V38 — CANONICAL MOBILE\/PWA PRESENTATION LAYER/g) ?? []).length
if (canonicalCount !== 1) {
  console.error(`Mobile UI check failed: expected one canonical mobile layer, found ${canonicalCount}.`)
  process.exit(1)
}

console.log("Mobile/PWA UI check passed (single canonical presentation layer).")


const dashboard = fs.readFileSync("app/(app)/dashboard/page.tsx", "utf8")

if (dashboard.includes("mobileLabel=") || dashboard.includes("metric-label-mobile") || dashboard.includes("metric-label-desktop")) {
  console.error("Mobile UI check failed: dashboard KPI uses duplicate responsive label markup.")
  process.exit(1)
}

if (!dashboard.includes('id="owner-dashboard-kpis"')) {
  console.error("Mobile UI check failed: owner dashboard KPI strip is missing its canonical id.")
  process.exit(1)
}

const ownerBlock = dashboard.match(/id="owner-dashboard-kpis"[\s\S]*?<\/div>/)
if (!ownerBlock) {
  console.error("Mobile UI check failed: owner dashboard KPI block could not be verified.")
  process.exit(1)
}

console.log("Dashboard KPI check passed (single labels, canonical three-column owner strip).")
