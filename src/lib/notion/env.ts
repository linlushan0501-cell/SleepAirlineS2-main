import {
  DEFAULT_PARENT_PAGE_ID,
  normalizeNotionParentPageId,
  resolveNotionParentPageId,
} from './parent-page';

export interface NotionTarget {
  key: 'myself' | 'shared';
  apiKey: string;
  parentPageId: string;
}

export function resolveNotionApiKey(): string | null {
  return process.env.MYSELF_NOTION_API_KEY
    ?? process.env.NOTION_API_KEY
    ?? null;
}

export function hasNotionApiKey(): boolean {
  return !!resolveNotionApiKey();
}

export function getPrimaryNotionTarget(): NotionTarget | null {
  const apiKey = resolveNotionApiKey();
  if (!apiKey) return null;

  return {
    key: process.env.MYSELF_NOTION_API_KEY ? 'myself' : 'shared',
    apiKey,
    parentPageId: resolveNotionParentPageId(),
  };
}

export function getSharedNotionTarget(): NotionTarget | null {
  if (!process.env.NOTION_API_KEY) return null;

  return {
    key: 'shared',
    apiKey: process.env.NOTION_API_KEY,
    parentPageId: normalizeNotionParentPageId(process.env.NOTION_PARENT_PAGE_ID ?? DEFAULT_PARENT_PAGE_ID),
  };
}

export function getMirrorNotionTargets(): NotionTarget[] {
  const primary = getPrimaryNotionTarget();
  const shared = getSharedNotionTarget();

  if (!primary || !shared) return [];
  if (primary.apiKey === shared.apiKey && primary.parentPageId === shared.parentPageId) return [];

  return [shared];
}
