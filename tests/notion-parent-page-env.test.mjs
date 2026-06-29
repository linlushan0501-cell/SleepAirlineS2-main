import assert from 'node:assert/strict';

const {
  DEFAULT_PARENT_PAGE_ID,
  resolveNotionParentPageId,
} = await import('../src/lib/notion/parent-page.ts');

const originalMyself = process.env.MYSELF_NOTION_PARENT_PAGE_ID;
const originalLegacy = process.env.NOTION_PARENT_PAGE_ID;

try {
  process.env.MYSELF_NOTION_PARENT_PAGE_ID = '11111111-1111-1111-1111-111111111111';
  process.env.NOTION_PARENT_PAGE_ID = '22222222-2222-2222-2222-222222222222';
  assert.equal(
    resolveNotionParentPageId(),
    '11111111111111111111111111111111',
    'MYSELF_NOTION_PARENT_PAGE_ID should take precedence over NOTION_PARENT_PAGE_ID.'
  );

  delete process.env.MYSELF_NOTION_PARENT_PAGE_ID;
  process.env.NOTION_PARENT_PAGE_ID = '33333333-3333-3333-3333-333333333333';
  assert.equal(
    resolveNotionParentPageId(),
    '33333333333333333333333333333333',
    'NOTION_PARENT_PAGE_ID should still work as a fallback.'
  );

  delete process.env.NOTION_PARENT_PAGE_ID;
  assert.equal(
    resolveNotionParentPageId(),
    DEFAULT_PARENT_PAGE_ID,
    'Default parent page should be used when no parent env var is present.'
  );
} finally {
  if (originalMyself === undefined) {
    delete process.env.MYSELF_NOTION_PARENT_PAGE_ID;
  } else {
    process.env.MYSELF_NOTION_PARENT_PAGE_ID = originalMyself;
  }

  if (originalLegacy === undefined) {
    delete process.env.NOTION_PARENT_PAGE_ID;
  } else {
    process.env.NOTION_PARENT_PAGE_ID = originalLegacy;
  }
}
