// Renders tabs 4 and 5 against a minimal DOM stub (no browser, no dependencies).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildModel } = require('../src/model');
const { renderFan360 } = require('../src/ui/tab-fan360');
const { renderProfile } = require('../src/ui/tab-profile');

function makeNode(tag) {
  const n = {
    tag, className: '', children: [], listeners: {}, style: {}, attrs: {}, _text: '', value: '',
    appendChild(c) { this.children.push(c); return c; },
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(t, f) { this.listeners[t] = f; },
    get textContent() { return this._text + this.children.map((c) => c.textContent).join(' '); },
    set textContent(v) { this._text = v; this.children = []; },
  };
  return n;
}
globalThis.document = { createElement: makeNode };
const walk = (n, fn) => { fn(n); n.children.forEach((c) => walk(c, fn)); };
const find = (n, cls) => { const out = []; walk(n, (x) => { if (x.className.split(' ').includes(cls)) out.push(x); }); return out; };

const M = buildModel();
const ctxFor = (state, payload) => ({ model: M, state, goTo() {}, setState() {}, payload });

test('tab 4 renders parts, takeaways and a large tile', () => {
  const el = makeNode('div');
  renderFan360(el, M.views.fan360);
  const text = el.textContent;
  assert.ok(text.includes(M.views.fan360.funnel.totalLabel));
  assert.ok(text.includes(M.views.fan360.takeaways.valueBySystems));
  assert.equal(find(el, 'kpi-large').length, 1);
  assert.equal(find(el, 'takeaway').length, 4);
});

test('tab 5 renders every hero in both roles', () => {
  for (const h of ['H1', 'H2', 'H3', 'H4']) {
    const fan = M.fans.find((f) => f.heroId === h);
    for (const role of ['sales', 'privacy']) {
      const el = makeNode('div');
      renderProfile(el, ctxFor({ role, selectedFanId: fan.fanId }));
      assert.ok(el.textContent.includes(fan.name));
      assert.ok(!el.textContent.includes('-09-30'));
    }
  }
});

test('tab 5 defaults to H1, masks for sales, shows child join date for privacy', () => {
  const state = { role: 'sales', selectedFanId: null };
  const el = makeNode('div');
  renderProfile(el, ctxFor(state));
  assert.equal(state.selectedFanId, M.fans.find((f) => f.heroId === 'H1').fanId);
  const h4 = M.fans.find((f) => f.heroId === 'H4');
  const sales = makeNode('div');
  renderProfile(sales, ctxFor({ role: 'sales', selectedFanId: h4.fanId }));
  assert.ok(find(sales, 'pill-restricted').length > 0);
  assert.match(sales.textContent, /\d Kids Club members? \(restricted\)/);
  const priv = makeNode('div');
  renderProfile(priv, ctxFor({ role: 'privacy', selectedFanId: h4.fanId }));
  assert.equal(find(priv, 'pill-restricted').length, 0);
  assert.match(priv.textContent, /joined \d{4}-\d{2}-\d{2}/);
});

test('role toggle keeps the selected fan; payload selects a fan', () => {
  const h2 = M.fans.find((f) => f.heroId === 'H2');
  const state = { role: 'sales', selectedFanId: null };
  const el = makeNode('div');
  renderProfile(el, ctxFor(state, { fanId: h2.fanId }));
  assert.equal(state.selectedFanId, h2.fanId);
  const privBtn = find(el, 'role-btn')[1];
  privBtn.listeners.click();
  assert.equal(state.role, 'privacy');
  assert.equal(state.selectedFanId, h2.fanId);
  assert.ok(el.textContent.includes(h2.name));
});
