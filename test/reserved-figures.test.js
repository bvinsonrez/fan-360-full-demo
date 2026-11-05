const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { buildModel } = require('../src/model');
const { collectDisplayedStrings } = require('../src/display-metrics');

const model = buildModel();
const file = process.env.RESERVED_FIGURES_FILE;

test('displayed strings are plentiful and well formed', () => {
  const shown = collectDisplayedStrings(model);
  assert.ok(shown.length > 100, `only ${shown.length} strings`);
  for (const s of shown) {
    assert.ok(!/NaN|undefined|Infinity|-0(?![.\d])/.test(s), `bad string: ${s}`);
  }
});

test('no reserved figure is displayed', { skip: !file && 'RESERVED_FIGURES_FILE not set' }, () => {
  const reserved = fs.readFileSync(file, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
  const shown = collectDisplayedStrings(model);
  // token match with numeric boundaries, so "19%" does not hit "9%"
  const esc = (r) => r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hits = shown.filter((s) => reserved.some((r) => new RegExp('(^|[^0-9.,$])' + esc(r) + '($|[^0-9])').test(s)));
  assert.deepEqual(hits, []);
});
