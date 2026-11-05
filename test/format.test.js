const test = require('node:test');
const assert = require('node:assert/strict');
const { fmtCount, fmtMoney, fmtPct, fmtMultiple, roundParts, scaled } = require('../src/format');
const { mulberry32, pick, intBetween } = require('../src/rng');
const config = require('../src/config');

test('fmtCount', () => {
  assert.equal(fmtCount(845), '845');
  assert.equal(fmtCount(12375), '12.4K');
  assert.equal(fmtCount(1234567), '1.23M');
});
test('boundaries', () => {
  assert.equal(fmtCount(0), '0');
  assert.equal(fmtCount(999), '999');
  assert.equal(fmtCount(999.6), '1.00K');
  assert.equal(fmtCount(1000), '1.00K');
  assert.equal(fmtCount(999500), '1.00M');
  assert.equal(fmtCount(-0), '0');
  assert.equal(fmtCount(1000000), '1.00M');
});
test('roundParts adds up on screen', () => {
  const r = roundParts([10375, 1225, 850]);
  assert.equal(r.total, r.parts.reduce((a, b) => a + b, 0));
  assert.deepEqual(r.labels, ['10.4K', '1.2K', '0.9K']);
  assert.equal(r.totalLabel, '12.5K');
});
test('roundParts all zero', () => {
  const r = roundParts([0, 0, 0]);
  assert.equal(r.totalLabel, '0');
});
test('scaled and money', () => {
  assert.equal(scaled(4), 100);
  assert.equal(fmtMoney(845), '$845');
  assert.equal(fmtMoney(12375), '$12.4K');
  assert.equal(fmtMoney(1234567), '$1.23M');
  assert.equal(fmtMultiple(2.66), '2.7x');
  assert.equal(fmtPct(0.137), '14%');
});
test('mulberry32 deterministic', () => {
  const a = mulberry32(7), b = mulberry32(7);
  assert.equal(a(), b());
});
test('rng helpers', () => {
  const r = mulberry32(1);
  for (let i = 0; i < 200; i++) {
    const v = r();
    assert.ok(v >= 0 && v < 1);
    const n = intBetween(r, 3, 5);
    assert.ok(Number.isInteger(n) && n >= 3 && n <= 5);
  }
  assert.equal(pick(mulberry32(2), ['a', 'b'], [0, 1]), 'b');
});
test('config channel rates avoid reserved percentages', () => {
  assert.equal(config.SEED, 20261105);
  assert.equal(config.CHANNELS.length, 4);
  for (const ch of config.CHANNELS) {
    assert.ok(ch.label && ch.aov > 0);
    for (const v of Object.values(ch.rates)) {
      assert.notEqual(fmtPct(v), '9%');
      assert.notEqual(fmtPct(v), '22%');
    }
  }
  assert.equal(config.CHANNELS.find((c) => c.id === 'sms').note, 'Requires documented consent, not just a preference flag.');
});
