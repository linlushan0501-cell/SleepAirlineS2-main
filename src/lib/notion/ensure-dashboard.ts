import type { Client } from '@notionhq/client';
import { DASHBOARD_TITLE, getDashboardProperties } from './dashboard-schema';
import { getNotionClient, getNotionClientForApiKey } from './client';
import { resolveDbIdWithFallback } from './db-access';
import { isUsingCustomNotionParentPage, resolveNotionParentPageId } from './parent-page';
import type { NotionTarget } from './env';

let cachedDbId: string | null = null;
let resolving: Promise<string> | null = null;
const cachedTargetDbIds = new Map<string, string>();
const resolvingTargetDbIds = new Map<string, Promise<string>>();

async function readDatabaseTitle(client: Client, databaseId: string): Promise<string> {
  const db = await client.databases.retrieve({ database_id: databaseId });
  const title = (db as { title?: { plain_text: string }[] }).title;
  return title?.[0]?.plain_text ?? '';
}

async function findDashboardOnPage(client: Client, parentPageId: string): Promise<string | null> {
  let cursor: string | undefined;

  do {
    const response = await client.blocks.children.list({
      block_id: parentPageId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const block of response.results) {
      const typed = block as { type?: string; id?: string };
      if (typed.type !== 'child_database' || !typed.id) continue;
      const title = await readDatabaseTitle(client, typed.id);
      if (title === DASHBOARD_TITLE) return typed.id;
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return null;
}

async function createDashboard(client: Client, parentPageId: string): Promise<string> {
  const db = await client.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: DASHBOARD_TITLE } }],
    properties: getDashboardProperties(),
  });
  return db.id;
}

function isOwnWorkspace(): boolean {
  return isUsingCustomNotionParentPage();
}

function canWriteSchema(): boolean {
  return process.env.NOTION_ALLOW_SCHEMA_WRITE === 'true' || isOwnWorkspace();
}

function canWriteSchemaForParent(parentPageId: string): boolean {
  return process.env.NOTION_ALLOW_SCHEMA_WRITE === 'true'
    || parentPageId !== '388a7f1b413c8015824ff6fb8bc1d65b';
}

async function findOrCreateDashboard(
  client: Client,
  parentPageId: string,
  canCreateSchema: boolean
): Promise<string> {
  try {
    return await resolveDbIdWithFallback({
      client,
      envDbId: process.env.NOTION_DASHBOARD_DB_ID,
      expectedTitle: DASHBOARD_TITLE,
      findOnParentPage: findDashboardOnPage,
      parentPageId,
    });
  } catch (fallbackErr) {
    if (!canCreateSchema) throw fallbackErr;

    try {
      return await createDashboard(client, parentPageId);
    } catch {
      const retry = await findDashboardOnPage(client, parentPageId);
      if (retry) return retry;
      throw new Error('無法在 Notion 父頁面建立 Dashboard，請確認 Integration 已 Connect。');
    }
  }
}

export async function resolveDashboardDbId(): Promise<string> {
  if (cachedDbId) return cachedDbId;

  if (!resolving) {
    resolving = findOrCreateDashboard(
      getNotionClient(),
      resolveNotionParentPageId(),
      canWriteSchema()
    )
      .then((id) => {
        cachedDbId = id;
        return id;
      })
      .finally(() => {
        resolving = null;
      });
  }

  return resolving;
}

export async function resolveDashboardDbIdForTarget(target: NotionTarget): Promise<string> {
  const cacheKey = `${target.key}:${target.apiKey}:${target.parentPageId}`;
  const cached = cachedTargetDbIds.get(cacheKey);
  if (cached) return cached;

  const existing = resolvingTargetDbIds.get(cacheKey);
  if (existing) return existing;

  const promise = findOrCreateDashboard(
    getNotionClientForApiKey(target.apiKey),
    target.parentPageId,
    canWriteSchemaForParent(target.parentPageId)
  )
    .then((id) => {
      cachedTargetDbIds.set(cacheKey, id);
      return id;
    })
    .finally(() => {
      resolvingTargetDbIds.delete(cacheKey);
    });

  resolvingTargetDbIds.set(cacheKey, promise);
  return promise;
}
