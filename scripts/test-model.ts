import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { simulate } from '../src/model';
const python = JSON.parse(readFileSync(new URL('../validation/python-baselines.json', import.meta.url), 'utf8'));
const evidence: any[] = [];
for (const source of python) {
  const js = simulate(source.H);
  const differences: Record<string, number> = {};
  for (const key of ['time', 'frequency', 'rocof', 'imbalance_mw'] as const) {
    assert.equal(js[key].length, source[key].length);
    differences[key] = Math.max(...js[key].map((v, i) => Math.abs(v - source[key][i])));
    assert(differences[key] <= 1e-6, `${source.H} ${key} mismatch`);
  }
  assert.equal(js.events.length, source.events.length);
  js.events.forEach((e, i) => { assert.equal(e.kind, source.events[i][1]); assert(Math.abs(e.time - source.events[i][0]) <= .02); });
  assert(js.frequency.every(Number.isFinite));
  evidence.push({ H: source.H, differences, events: js.events, minimum: js.minimum });
}
const short = simulate(4, 120), long = simulate(4, 200);
assert.deepEqual(short.frequency, long.frequency.slice(0, short.frequency.length));
const tiny = simulate(4, .02); assert.equal(tiny.loadShedTime, null);
for (const invalid of [0, -1, Infinity, NaN]) assert.throws(() => simulate(invalid));
writeFileSync(new URL('../validation/model-test.json', import.meta.url), JSON.stringify({ passed: true, checked: '5 full Python series + events + 120s equivalence + invalid inputs + no-trigger duration', cases: evidence }, null, 2));
console.log('PASS: 5 Python reference cases, all arrays/events; 120 s prefix; validation and no-event case.');
