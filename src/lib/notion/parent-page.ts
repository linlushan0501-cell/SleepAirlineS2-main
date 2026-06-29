export const DEFAULT_PARENT_PAGE_ID = '388a7f1b413c8015824ff6fb8bc1d65b';

function normalizeNotionId(id: string): string {
  const trimmed = id.trim();
  const uuidPattern = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
  const uuid = trimmed.match(uuidPattern)?.at(-1);
  if (uuid) return uuid.replace(/-/g, '').toLowerCase();

  const beforeQuery = trimmed.split(/[?#]/)[0] ?? trimmed;
  const segments = beforeQuery.split('/').filter(Boolean).reverse();

  for (const segment of segments) {
    const decoded = decodeURIComponent(segment);
    const direct = decoded.match(/^[0-9a-fA-F]{32}$/)?.[0];
    if (direct) return direct.toLowerCase();

    const afterLastDash = decoded.split('-').at(-1) ?? '';
    if (/^[0-9a-fA-F]{32}$/.test(afterLastDash)) {
      return afterLastDash.toLowerCase();
    }
  }

  return trimmed.replace(/-/g, '');
}

export function resolveNotionParentPageId(): string {
  const raw =
    process.env.MYSELF_NOTION_PARENT_PAGE_ID
    ?? process.env.NOTION_PARENT_PAGE_ID
    ?? DEFAULT_PARENT_PAGE_ID;

  return normalizeNotionId(raw);
}

export function isUsingCustomNotionParentPage(): boolean {
  return resolveNotionParentPageId() !== normalizeNotionId(DEFAULT_PARENT_PAGE_ID);
}
