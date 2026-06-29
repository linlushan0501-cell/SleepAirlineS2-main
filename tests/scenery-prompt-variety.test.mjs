import assert from 'node:assert/strict';

const {
  SCENERY_PROMPT_VARIANTS,
  buildSceneryPrompt,
} = await import('../src/lib/ai/scenery-prompt.ts');

assert.ok(
  SCENERY_PROMPT_VARIANTS.length >= 6,
  'Landing scenery should offer at least six visual variants.'
);

const prompts = SCENERY_PROMPT_VARIANTS.map((_, index) =>
  buildSceneryPrompt('Neihu', 'Taiwan', '內湖，臺灣', index)
);

assert.equal(new Set(prompts).size, prompts.length, 'Each scenery variant should create a distinct prompt.');

for (const prompt of prompts) {
  assert.match(prompt, /內湖，臺灣/, 'Prompt should include the displayed arrival location.');
  assert.match(prompt, /Taiwan/, 'Prompt should include the country context.');
  assert.match(prompt, /no people, no text, no watermark, no logos/i);
}
