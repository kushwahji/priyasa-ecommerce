import React from 'react';

const base = () => process.env.NEXT_PUBLIC_APP_URL || 'https://priyasa.com';

export function SiteStructuredData() {
  const url = base();
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {'@type':'Organization','@id':`${url}/#organization`,'name':'PRIYASA','url','logo':`${url}/images/priyasa-logo.svg`},
      {'@type':'WebSite','@id':`${url}/#website`,'name':'PRIYASA','url','publisher':{'@id':`${url}/#organization`},'potentialAction':{'@type':'SearchAction','target':`${url}/shop?search={search_term_string}`,'query-input':'required name=search_term_string'}},
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data)}} />;
}

export function BreadcrumbStructuredData({items}:{items:Array<{name:string;url:string}>}) {
  const data = {'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':items.map((item,index)=>({'@type':'ListItem','position':index+1,'name':item.name,'item':item.url}))};
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data)}} />;
}
