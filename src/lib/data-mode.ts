import { formatNotionError } from './notion/db-access';
import { resolveDashboardDbId } from './notion/ensure-dashboard';
import { hasNotionApiKey } from './notion/env';

export type DataMode = 'preview' | 'live';

export function getDataMode(): DataMode {
  const raw = process.env.SLEEP_AIRLINE_DATA_MODE?.trim().toLowerCase();
  if (raw === 'preview') return 'preview';
  if (raw === 'live') return 'live';
  return hasNotionApiKey() ? 'live' : 'preview';
}

export function isLiveDataMode(): boolean {
  return getDataMode() === 'live';
}

export async function getDataModeStatus(): Promise<{
  dataMode: DataMode;
  notionConfigured: boolean;
  notionReady: boolean;
  hint: string;
  notionError?: string;
}> {
  const dataMode = getDataMode();
  const hasKey = hasNotionApiKey();
  const notionConfigured = dataMode === 'live' && hasKey;

  if (dataMode === 'preview') {
    return {
      dataMode,
      notionConfigured: false,
      notionReady: false,
      hint: '',
    };
  }

  if (!hasKey) {
    return {
      dataMode,
      notionConfigured: false,
      notionReady: false,
      hint: 'live 模式但未設定 Notion API Key，請在 Vercel 補上 MYSELF_NOTION_API_KEY 或 NOTION_API_KEY。',
    };
  }

  try {
    await resolveDashboardDbId();
    return {
      dataMode,
      notionConfigured: true,
      notionReady: true,
      hint: '',
    };
  } catch (err) {
    return {
      dataMode,
      notionConfigured: true,
      notionReady: false,
      notionError: formatNotionError(err),
      hint: formatNotionError(err),
    };
  }
}
