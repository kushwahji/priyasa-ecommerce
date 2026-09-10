import Link from 'next/link';

const GOOGLE_PLAY_BADGE='https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png';
const APP_STORE_BADGE='https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg';
const PRIYASA_PLAY_STORE_URL='https://play.google.com/store/apps/details?id=com.priyasa';

function Badge({href,src,alt,available,label}:{href?:string;src:string;alt:string;available:boolean;label:string}){
 const content=<><img src={src} alt={alt} width={564} height={168}/>{!available&&<span className="app-badge-coming-soon">Coming soon</span>}</>;
 return available
  ? <a className="app-badge app-badge-image" href={href} target="_blank" rel="noreferrer" aria-label={alt}>{content}</a>
  : <Link className="app-badge app-badge-image is-coming-soon" href="/app" aria-label={`${label} coming soon`}>{content}</Link>;
}

export function AppDownloadBadges(){
 const play=process.env.NEXT_PUBLIC_PLAY_STORE_URL||PRIYASA_PLAY_STORE_URL;
 const app=process.env.NEXT_PUBLIC_APP_STORE_URL;
 return <div className="app-badges" aria-label="Get the Priyasa app">
  <Badge href={play} src={GOOGLE_PLAY_BADGE} alt="Get it on Google Play" available label="Google Play"/>
  <Badge href={app} src={APP_STORE_BADGE} alt="Download on the App Store" available={Boolean(app)} label="App Store"/>
 </div>;
}
