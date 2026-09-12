import { getHomeApiSections } from '@/lib/home-cms-api';
import { renderHomeSections } from '@/app/home-api-renderer';
import { HomeApiStyles } from '@/components/HomeApiAdvancedSections';
import { SiteStructuredData } from '@/app/seo-schema';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const sections = await getHomeApiSections();
  return <>
    <SiteStructuredData />
    <HomeApiStyles />
    <main className="home-page home-reference-v4">{await renderHomeSections(sections)}</main>
  </>;
}
