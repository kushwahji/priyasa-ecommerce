export type HomeApiSection = {
  id: string | number;
  key?: string;
  type?: string;
  title?: string | null;
  subtitle?: string | null;
  sort_order?: number;
  sortOrder?: number;
  is_active?: boolean;
  isActive?: boolean;
  content?: Record<string, any> | any[];
  [key: string]: any;
};

export type HomeApiHeader = {
  logo?: { image_url?: string; alt?: string };
  search?: { enabled?: boolean; placeholder?: string; endpoint?: string };
  cart?: { enabled?: boolean; show_count?: boolean };
};

export type HomeApiData = {
  version?: number;
  page?: string;
  layout?: string;
  currency?: string;
  locale?: string;
  header?: HomeApiHeader;
  sections: HomeApiSection[];
};

type HomeApiResponse = { success?: boolean; data?: HomeApiData | HomeApiSection[]; message?: string };
const BASE_URL = (process.env.PRIYASA_API_BASE_URL || 'https://api.priyasa.com').replace(/\/$/, '');

export async function getHomeApiData(): Promise<HomeApiData> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/storefront/home`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Priyasa-Web/2.0' },
      next: { revalidate: 60, tags: ['storefront-home-cms'] },
    });
    const body = await response.json().catch(() => null) as HomeApiResponse | null;
    if (!response.ok || body?.success === false) {
      throw new Error(body?.message || `Storefront home request failed (${response.status})`);
    }

    const data = body?.data;
    const rawSections = Array.isArray(data) ? data : Array.isArray(data?.sections) ? data.sections : [];
    const sections = rawSections
      .filter((section) => section && section.id != null && section.is_active !== false && section.isActive !== false)
      .sort((a, b) => Number(a.sort_order ?? a.sortOrder ?? 0) - Number(b.sort_order ?? b.sortOrder ?? 0));

    return Array.isArray(data) ? { sections } : { ...(data || {}), sections };
  } catch (error) {
    console.error('[Priyasa storefront] home CMS request failed', error);
    return { sections: [] };
  }
}

export async function getHomeApiSections(): Promise<HomeApiSection[]> {
  return (await getHomeApiData()).sections;
}
