export function resolveNotionApiKey(): string | null {
  return process.env.MYSELF_NOTION_API_KEY
    ?? process.env.NOTION_API_KEY
    ?? null;
}

export function hasNotionApiKey(): boolean {
  return !!resolveNotionApiKey();
}
