import assert from 'node:assert/strict';

const {
  resolveNotionApiKey,
  hasNotionApiKey,
} = await import('../src/lib/notion/env.ts');

const originalMyself = process.env.MYSELF_NOTION_API_KEY;
const originalLegacy = process.env.NOTION_API_KEY;

try {
  process.env.MYSELF_NOTION_API_KEY = 'secret_myself';
  process.env.NOTION_API_KEY = 'secret_legacy';
  assert.equal(
    resolveNotionApiKey(),
    'secret_myself',
    'MYSELF_NOTION_API_KEY should take precedence over NOTION_API_KEY.'
  );
  assert.equal(hasNotionApiKey(), true);

  delete process.env.MYSELF_NOTION_API_KEY;
  process.env.NOTION_API_KEY = 'secret_legacy';
  assert.equal(
    resolveNotionApiKey(),
    'secret_legacy',
    'NOTION_API_KEY should still work as a fallback.'
  );
  assert.equal(hasNotionApiKey(), true);

  delete process.env.NOTION_API_KEY;
  assert.equal(resolveNotionApiKey(), null);
  assert.equal(hasNotionApiKey(), false);
} finally {
  if (originalMyself === undefined) {
    delete process.env.MYSELF_NOTION_API_KEY;
  } else {
    process.env.MYSELF_NOTION_API_KEY = originalMyself;
  }

  if (originalLegacy === undefined) {
    delete process.env.NOTION_API_KEY;
  } else {
    process.env.NOTION_API_KEY = originalLegacy;
  }
}
