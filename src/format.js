// Display formatters. All person-level counts shown in the UI pass through here.
const { SCALE } = require('./config');

function scaled(raw) {
  return raw * SCALE;
}

// Round half up to `d` decimals, avoiding binary drift on exact ties.
function roundTo(v, d) {
  const f = Math.pow(10, d);
  return Math.round(Math.round(v * f * 1e6) / 1e6) / f;
}

// 3 significant figures for a value already divided into its unit (1 <= v < 1000).
function sig3(v) {
  const d = v < 10 ? 2 : v < 100 ? 1 : 0;
  const r = roundTo(v, d);
  return { r, text: r.toFixed(d) };
}

function compact(n) {
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (Math.round(a) < 1000) {
    const r = Math.round(a);
    return r === 0 ? '0' : sign + r;
  }
  if (a < 1e6) {
    const k = sig3(a / 1000);
    if (k.r < 1000) return sign + k.text + 'K';
  }
  return sign + sig3(a / 1e6).text + 'M';
}

function fmtCount(n) {
  return compact(n);
}

function fmtMoney(dollars) {
  const s = compact(dollars);
  return s[0] === '-' ? '-$' + s.slice(1) : '$' + s;
}

function fmtPct(fraction, digits = 0) {
  const s = roundTo(fraction * 100, digits).toFixed(digits);
  return (Number(s) === 0 ? (0).toFixed(digits) : s) + '%';
}

function fmtMultiple(x) {
  return roundTo(x, 1).toFixed(1) + 'x';
}

function roundParts(parts) {
  const max = Math.max(0, ...parts);
  const exp = max > 0 ? Math.floor(Math.log10(max)) : 0;
  const unit = Math.max(1, Math.pow(10, exp - 2));
  const rounded = parts.map((p) => Math.round(p / unit) * unit);
  const total = rounded.reduce((a, b) => a + b, 0);
  // Display scale follows the largest part; promote if the total outgrows it.
  let scale = max >= 1e6 ? 1e6 : max >= 1000 ? 1000 : 1;
  if (total >= scale * 1000 && scale < 1e6) scale *= 1000;
  const decimals = Math.max(0, Math.round(Math.log10(scale / unit)));
  const suffix = scale === 1e6 ? 'M' : scale === 1000 ? 'K' : '';
  const label = (v) => (v === 0 ? '0' : (v / scale).toFixed(decimals) + suffix);
  return { unit, parts: rounded, total, labels: rounded.map(label), totalLabel: label(total) };
}

module.exports = { scaled, fmtCount, fmtMoney, fmtPct, fmtMultiple, roundParts };
