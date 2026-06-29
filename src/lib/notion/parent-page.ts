export const DEFAULT_PARENT_PAGE_ID = '388a7f1b413c8015824ff6fb8bc1d65b';

function normalizeNotionId(id: string): string {
  return id.replace(/-/g, '');
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
