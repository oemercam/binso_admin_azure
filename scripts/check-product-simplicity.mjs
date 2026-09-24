import fs from 'node:fs'
const plans = fs.readFileSync('lib/data/plans.ts','utf8')
const nav = fs.readFileSync('components/navigation/nav-items.ts','utf8')
const customers = fs.readFileSync('app/(app)/customers/page.tsx','utf8')
const quotes = fs.readFileSync('app/(app)/quotes/page.tsx','utf8')
const failures = []
if (!/starter[\s\S]*'orders'[\s\S]*'invoices'/.test(plans)) failures.push('Starter must keep the complete customer→quote→order→invoice core flow')
if (!/selfService: false/.test(plans)) failures.push('Enterprise must remain outside the three standard self-service models')
if (/href: '\/contacts'/.test(nav)) failures.push('Contacts must not duplicate Customers in primary navigation')
if (!/Weitere Angaben/.test(customers)) failures.push('Customer creation must progressively disclose secondary fields')
if (!/Neuen Kunden erfassen/.test(quotes)) failures.push('Quote creation must support an inline new customer')
if (failures.length) { console.error(`Product simplicity checks failed (${failures.length}):`); failures.forEach(f=>console.error(`- ${f}`)); process.exit(1) }
console.log('Product simplicity checks passed.')
