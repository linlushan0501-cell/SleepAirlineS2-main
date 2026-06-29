import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const source = readFileSync(
  new URL('../src/lib/notion/notion-file-upload.ts', import.meta.url),
  'utf8'
);

assert.match(
  source,
  /resolveNotionApiKey/,
  'Notion file uploads should use the same resolved API key as database writes.'
);

assert.doesNotMatch(
  source,
  /Authorization:\s*`Bearer \$\{process\.env\.NOTION_API_KEY\}`/,
  'Notion file uploads must not bypass MYSELF_NOTION_API_KEY.'
);
