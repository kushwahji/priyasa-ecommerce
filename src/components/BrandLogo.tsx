import Link from 'next/link';

type BrandLogoProps={href?:string;compact?:boolean;className?:string};
export function PriyasaMark(){return null;}
export function BrandLogo({href='/',compact=false,className=''}:BrandLogoProps){const content=<span className={`brand-lockup ${compact?'brand-lockup--compact':''} ${className}`}><span className="brand-wordmark"><strong>PRIYASA</strong><small>STYLE · COMFORT · YOU</small></span></span>;return href?<Link href={href} className="brand-logo-link" aria-label="PRIYASA home">{content}</Link>:content;}
