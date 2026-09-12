import DynamicHome from '@/components/DynamicHome';
import {getHomeCms} from '@/lib/storefront-data';
import {SiteStructuredData} from '@/app/seo-schema';

export const revalidate=120;

export default async function Home(){
 const sections=await getHomeCms();
 return <><SiteStructuredData/><DynamicHome initialSections={sections}/></>;
}
