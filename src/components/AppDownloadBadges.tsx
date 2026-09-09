import Link from 'next/link';

const GOOGLE_PLAY_BADGE='https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png';
const APP_STORE_BADGE='https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg';

export function AppDownloadBadges(){
 const play=process.env.NEXT_PUBLIC_PLAY_STORE_URL;
 const app=process.env.NEXT_PUBLIC_APP_STORE_URL;
 return <div className="app-badges" aria-label="Get the Priyasa app">
  {play ? <a className="app-badge app-badge-image" href={play} target="_blank" rel="noreferrer" aria-label="Get Priyasa on Google Play"><img src={GOOGLE_PLAY_BADGE} alt="Get it on Google Play" width={564} height={168}/></a> : <Link className="app-badge app-badge-image" href="/app" aria-label="Priyasa Google Play app coming soon"><img src={GOOGLE_PLAY_BADGE} alt="Coming soon on Google Play" width={564} height={168}/></Link>}
  {app ? <a className="app-badge app-badge-image" href={app} target="_blank" rel="noreferrer" aria-label="Download Priyasa on the App Store"><img src={APP_STORE_BADGE} alt="Download on the App Store" width={280} height={94}/></a> : <Link className="app-badge app-badge-image" href="/app" aria-label="Priyasa App Store app coming soon"><img src={APP_STORE_BADGE} alt="Coming soon on the App Store" width={280} height={94}/></Link>}
 </div>
}
