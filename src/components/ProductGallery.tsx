'use client';

import { useState } from 'react';
import { SafeImage } from '@/components/SafeImage';

export function ProductGallery({ image, name, gallery = [] }: { image: string; name: string; gallery?: string[] }) {
  const images = [...new Set([image, ...gallery])];
  const [active, setActive] = useState(0);
  return <div className="pdp-gallery">
    <div className="pdp-thumbs">{images.map((src,i)=><button key={src+i} className={i===active?'active':''} onClick={()=>setActive(i)} aria-label={`View image ${i+1}`}><SafeImage src={src} alt="" width={120} height={150}/></button>)}</div>
    <div className="pdp-main-image"><SafeImage src={images[active]} alt={name} width={1000} height={1250} priority /></div>
  </div>;
}
