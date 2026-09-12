import { unstable_cache } from 'next/cache';

export type HomeApiSection = {
  id: string | number;
  key?: string;
  type?: string;
  title?: string;
  subtitle?: string;
  sort_order?: number;
  is_active?: boolean;
  content?: Record<string, any> | any[];
  [key: string]: any;
};

type HomeApiResponse = { success?: boolean; data?: { sections?: HomeApiSection[] } | HomeApiSection[] };
const BASE_URL = (process.env.PRIYASA_API_BASE_URL || 'https://api.priyasa.com').replace(/\/$/, '');

async function fetchHome(): Promise<HomeApiSection[]> {
  const response = await fetch(`${BASE_URL}/api/v1/storefront/cms/home`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  const body = await response.json().catch(() => null) as HomeApiResponse | null;
  if (!response.ok || body?.success === false) throw new Error(body && 'message' in body ? String((body as any).message || `Home CMS request failed (${response.status})`) : `Home CMS request failed (${response.status})`);
  const data = body?.data;
  const sections = Array.isArray(data) ? data : Array.isArray(data?.sections) ? data.sections : [];
  return sections.filter((section) => section && section.is_active !== false).sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
}

export const getHomeApiSections = unstable_cache(fetchHome, ['priyasa-home-api-v1'], { revalidate: 60, tags: ['storefront-home-cms'] });
