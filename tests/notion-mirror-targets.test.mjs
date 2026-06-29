import assert from 'node:assert/strict';

const {
  getPrimaryNotionTarget,
  getMirrorNotionTargets,
} = await import('../src/lib/notion/env.ts');

const original = {
  myselfKey: process.env.MYSELF_NOTION_API_KEY,
  myselfParent: process.env.MYSELF_NOTION_PARENT_PAGE_ID,
  sharedKey: process.env.NOTION_API_KEY,
  sharedParent: process.env.NOTION_PARENT_PAGE_ID,
};

try {
  process.env.MYSELF_NOTION_API_KEY = 'secret_myself';
  process.env.MYSELF_NOTION_PARENT_PAGE_ID = '11111111-1111-1111-1111-111111111111';
  process.env.NOTION_API_KEY = 'secret_shared';
  process.env.NOTION_PARENT_PAGE_ID = '22222222-2222-2222-2222-222222222222';

  const primary = getPrimaryNotionTarget();
  assert.equal(primary?.key, 'myself');
  assert.equal(primary?.apiKey, 'secret_myself');
  assert.equal(primary?.parentPageId, '11111111111111111111111111111111');

  const mirrors = getMirrorNotionTargets();
  assert.equal(mirrors.length, 1);
  assert.equal(mirrors[0].key, 'shared');
  assert.equal(mirrors[0].apiKey, 'secret_shared');
  assert.equal(mirrors[0].parentPageId, '22222222222222222222222222222222');
} finally {
  for (const [key, value] of Object.entries({
    MYSELF_NOTION_API_KEY: original.myselfKey,
    MYSELF_NOTION_PARENT_PAGE_ID: original.myselfParent,
    NOTION_API_KEY: original.sharedKey,
    NOTION_PARENT_PAGE_ID: original.sharedParent,
  })) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}
