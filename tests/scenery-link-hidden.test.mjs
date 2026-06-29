import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const css = readFileSync(new URL('../public/style.css', import.meta.url), 'utf8');

assert.match(
  css,
  /\.scenery-link\s*\{[^}]*display:\s*none;[^}]*\}/s,
  'The generated image URL link below the scenery image should stay hidden.'
);
