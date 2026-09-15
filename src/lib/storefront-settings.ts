import { priyasaApi } from '@/lib/priyasa-api';

export type StorefrontSettings = {
  site_title?: string;
  site_description?: string;
  logo_url?: string;
  mobile_logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  accent_color?: string;
  announcement_enabled?: boolean;
  announcement_text?: string;
  free_shipping_threshold?: number;
  currency?: string;
  [key: string]: unknown;
};

const FALLBACK: StorefrontSettings = {
  site_title: 'PRIYASA — Every You, Beautiful',
  site_description: 'Indian fashion for every you. Discover thoughtfully designed styles for every mood and moment.',
  logo_url: '/images/priyasa-logo.svg',
  mobile_logo_url: '/images/priyasa-icon.svg',
  favicon_url: '/images/priyasa-icon.svg',
  primary_color: '#ff3f6c',
  accent_color: '#ff3f6c',
  announcement_enabled: true,
  announcement_text: 'Free Shipping on orders above ₹999 • COD Available • Easy Returns',
  free_shipping_threshold: 999,
  currency: 'INR',
};

export async function getStorefrontSettings(): Promise<StorefrontSettings> {
  try {
    const { response, body } = await priyasaApi('/api/v1/storefront/settings', { cache: 'no-store' });
    if (!response.ok) return FALLBACK;
    const data = (body as any)?.data;
    return { ...FALLBACK, ...(data && typeof data === 'object' ? data : {}) };
  } catch {
    return FALLBACK;
  }
}

export { FALLBACK as storefrontSettingsFallback };
