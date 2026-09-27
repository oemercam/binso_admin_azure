import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

async function importTs(path){
  const source=readFileSync(new URL(path,import.meta.url),'utf8')
  const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`)
}

const money=await importTs('../modules/shared/money.ts')
assert.equal(money.toMinorUnits(123.45),12345)
assert.equal(money.fromMinorUnits(12345),123.45)
assert.equal(money.toMinorUnits(0.1+0.2),30)
assert.deepEqual(money.lineTotalMinor({quantity:3,unitPrice:19.95,vatRate:8.1}),{netMinor:5985,vatMinor:485,grossMinor:6470})
assert.throws(()=>money.toMinorUnits(Number.NaN),/money_invalid/)

const sm=await importTs('../modules/shared/state-machine.ts')
assert.doesNotThrow(()=>sm.assertTransition('draft','sent',sm.quoteTransitions))
assert.throws(()=>sm.assertTransition('accepted','sent',sm.quoteTransitions),/invalid_transition/)
assert.doesNotThrow(()=>sm.assertTransition('sent','paid',sm.invoiceTransitions))
assert.throws(()=>sm.assertTransition('paid','draft',sm.invoiceTransitions),/invalid_transition/)

console.log('V82 domain behaviour tests passed: deterministic money and state transitions.')
