// Collects every string the UI shows for metrics, so tests can scan them.
const { CHANNELS, SCALE } = require('./config');
const { scaled, fmtCount, fmtMoney } = require('./format');
const { applyFilters, consentWaterfall, projectResults, projectionDisplay } = require('./segments');
const { fanProfileView, ROLES } = require('./views-profile');

const CHANNEL_IDS = CHANNELS.map((c) => c.id);

function addChart(out, c) {
  out.push(c.title, ...c.labels.map(String));
  for (const s of c.series) out.push(s.name);
}

function addWaterfall(out, w) {
  out.push(...w.display.labels, w.display.totalLabel, ...w.steps.map((s) => s.label));
}

function collectDisplayedStrings(model) {
  const out = [];
  const { views, fans, world, recommendations } = model;

  for (const v of [views.ticketing, views.fnb, views.groups]) {
    out.push(v.intro, v.cantTell);
    for (const k of v.kpis) out.push(k.label, k.value);
    for (const c of v.charts) addChart(out, c);
  }

  const f = views.fan360;
  for (const k of f.kpis) { out.push(k.label, k.value); if (k.note) out.push(k.note); }
  out.push(...f.funnel.labels, f.funnel.totalLabel, ...f.funnel.names);
  out.push(...f.matchBreakdown.labels, f.matchBreakdown.totalLabel, ...f.matchBreakdown.names);
  addChart(out, f.overlap);
  addChart(out, f.valueBySystems);
  out.push(...Object.values(f.takeaways));

  for (const id of CHANNEL_IDS) addWaterfall(out, consentWaterfall(fans, id));

  for (const card of recommendations) {
    out.push(
      card.name, card.ruleText, card.valueAssumption, card.whyNow,
      fmtCount(scaled(card.matched)), fmtCount(scaled(card.eligible)), fmtMoney(card.projectedValue),
      card.evidence.label, card.evidence.baselineLabel, card.evidence.segmentValue, card.evidence.baselineValue,
      ...card.evidence.chart.labels,
    );
    if (card.sponsorAudience) out.push(card.sponsorAudience);
    const audience = applyFilters(fans, card.filters);
    for (const id of CHANNEL_IDS) addWaterfall(out, consentWaterfall(audience, id));
    const disp = projectionDisplay(projectResults(card.eligible, CHANNEL_IDS));
    for (const c of disp.perChannel) { out.push(c.label); for (const r of c.rows) out.push(r.label, r.value); }
    for (const r of disp.combined) out.push(r.label, r.value);
  }

  for (const hero of fans.filter((x) => x.heroId)) {
    for (const role of Object.keys(ROLES)) {
      const p = fanProfileView(hero, role, world);
      out.push(p.header.name, p.header.region, p.header.roleLabel, p.header.confidence);
      for (const fld of p.fields) out.push(fld.label, fld.value);
      for (const h of p.household) out.push(h.label, h.value);
      for (const lane of p.swimlanes) for (const e of lane.events) out.push(e.label);
    }
  }
  return out.filter((s) => typeof s === 'string');
}

module.exports = { collectDisplayedStrings };
