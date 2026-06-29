import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const css = readFileSync(new URL('../public/style.css', import.meta.url), 'utf8');

const expectedThemeTokens = [
  '--bg: #fff7d6;',
  '--card: #ffffff;',
  '--border: #e1b12c;',
  '--text: #211a0b;',
  '--muted: #6f5b24;',
  '--amber: #f2b705;',
  '--sky: #111827;',
  '--input-bg: #fffdf2;',
];

for (const token of expectedThemeTokens) {
  assert.ok(css.includes(token), `Expected boarding-pass yellow theme token: ${token}`);
}

assert.ok(!css.includes('--bg: #050c1a;'), 'Dark navy background token should be removed');
assert.ok(!css.includes('Starfield'), 'Starfield motif should be removed from the yellow boarding-pass theme');
