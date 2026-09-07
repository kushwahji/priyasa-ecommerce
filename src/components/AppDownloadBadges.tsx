import Link from 'next/link';

export function AppDownloadBadges(){
 const play=process.env.NEXT_PUBLIC_PLAY_STORE_URL;
 const app=process.env.NEXT_PUBLIC_APP_STORE_URL;
 return <div className="app-badges" aria-label="Get the Priyasa app">
  {play?<a className="app-badge" href={play} target="_blank" rel="noreferrer"><span className="app-badge-icon">▶</span><span><small>GET IT ON</small><b>Google Play</b></span></a>:<Link className="app-badge" href="/app"><span className="app-badge-icon">▶</span><span><small>COMING SOON ON</small><b>Google Play</b></span></Link>}
  {app?<a className="app-badge" href={app} target="_blank" rel="noreferrer"><span className="app-badge-icon">●</span><span><small>DOWNLOAD ON THE</small><b>App Store</b></span></a>:<Link className="app-badge" href="/app"><span className="app-badge-icon">●</span><span><small>COMING SOON ON THE</small><b>App Store</b></span></Link>}
 </div>
}
