import { getCachedHomeCms } from '@/lib/storefront-cache';
import { renderHomeSections } from '@/app/home-api-renderer';
import { SiteStructuredData } from '@/app/seo-schema';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const sections = await getCachedHomeCms();
  return <>
    <SiteStructuredData />
    <main className="home-page home-reference-v4">{await renderHomeSections(sections)}</main>
  </>;
}
