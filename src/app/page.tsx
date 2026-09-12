import { getHomeApiData } from '@/lib/home-cms-api';
import { renderHomeSections } from '@/app/home-api-renderer-v2';
import { HomeApiStyles } from '@/components/HomeApiAdvancedSections';
import { HomeCmsOrderGuard } from '@/components/HomeCmsOrderGuard';
import { SiteStructuredData } from '@/app/seo-schema';

export const dynamic = 'force-dynamic';

const safeClass = (value: unknown) => String(value ?? '').toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'default';

export default async function Home() {
  const home = await getHomeApiData();
  const layout = safeClass(home.layout || 'default');
  return <>
    <SiteStructuredData />
    <HomeApiStyles />
    <HomeCmsOrderGuard />
    <main className={`home-page home-reference-v4 home-cms-layout-${layout}`} data-home-version={home.version ?? undefined} data-home-locale={home.locale ?? undefined} data-home-currency={home.currency ?? undefined}>
      {await renderHomeSections(home.sections)}
    </main>
  </>;
}
