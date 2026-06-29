import { Client } from '@notionhq/client';
import { getDataMode, isLiveDataMode } from '../data-mode';
import { resolveNotionApiKey } from './env';

let _client: Client | null = null;
let _clientApiKey: string | null = null;
const clientByApiKey = new Map<string, Client>();

/** live 模式且有 Notion API key 時才走 Notion；preview 一律用記憶體。 */
export function isNotionConfigured(): boolean {
  return isLiveDataMode() && !!resolveNotionApiKey();
}

export function getNotionClient(): Client {
  const apiKey = resolveNotionApiKey();
  if (!apiKey) {
    throw new Error('Notion API Key 尚未設定。請在 Vercel 環境變數中加入 MYSELF_NOTION_API_KEY 或 NOTION_API_KEY。');
  }
  if (!_client || _clientApiKey !== apiKey) {
    _client = new Client({ auth: apiKey });
    _clientApiKey = apiKey;
  }
  return _client;
}

export function getNotionClientForApiKey(apiKey: string): Client {
  const existing = clientByApiKey.get(apiKey);
  if (existing) return existing;

  const client = new Client({ auth: apiKey });
  clientByApiKey.set(apiKey, client);
  return client;
}

// ---- Property helpers: read ----

export function readTitle(props: Record<string, unknown>, key: string): string {
  const p = props[key] as { title?: { plain_text: string }[] } | undefined;
  return p?.title?.[0]?.plain_text ?? '';
}

export function readText(props: Record<string, unknown>, key: string): string {
  const p = props[key] as { rich_text?: { plain_text: string }[] } | undefined;
  return p?.rich_text?.[0]?.plain_text ?? '';
}

export function readSelect(props: Record<string, unknown>, key: string): string | null {
  const p = props[key] as { select?: { name: string } | null } | undefined;
  return p?.select?.name ?? null;
}

export function readNumber(props: Record<string, unknown>, key: string): number | null {
  const p = props[key] as { number?: number | null } | undefined;
  return p?.number ?? null;
}

export function readDate(props: Record<string, unknown>, key: string): string | null {
  const p = props[key] as { date?: { start: string } | null } | undefined;
  return p?.date?.start ?? null;
}

export function readCheckbox(props: Record<string, unknown>, key: string): boolean {
  const p = props[key] as { checkbox?: boolean } | undefined;
  return p?.checkbox ?? false;
}

export function readUrl(props: Record<string, unknown>, key: string): string {
  const p = props[key] as { url?: string | null } | undefined;
  return p?.url ?? '';
}

export function readFirstFileUrl(props: Record<string, unknown>, key: string): string {
  const p = props[key] as {
    files?: Array<{
      type?: string;
      file?: { url?: string };
      external?: { url?: string };
    }>;
  } | undefined;

  const file = p?.files?.[0];
  if (!file) return '';
  if (file.type === 'file' && file.file?.url) return file.file.url;
  if (file.type === 'external' && file.external?.url) return file.external.url;
  return '';
}

// ---- Property helpers: write ----

export function wTitle(value: string) {
  return { title: [{ text: { content: value } }] };
}

export function wText(value: string | null) {
  return { rich_text: value ? [{ text: { content: value } }] : [] };
}

export function wSelect(value: string | null) {
  return value ? { select: { name: value } } : { select: null };
}

export function wNumber(value: number | null) {
  return { number: value };
}

export function wDate(value: string | null) {
  return value ? { date: { start: value } } : { date: null };
}

export function wUrl(value: string | null) {
  return value ? { url: value } : { url: null };
}
