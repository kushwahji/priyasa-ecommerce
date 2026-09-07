import {NextResponse} from 'next/server';

export const dynamic='force-dynamic';

export async function GET(req:Request){
  const url=new URL(req.url); const lat=Number(url.searchParams.get('lat')); const lon=Number(url.searchParams.get('lon'));
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<-90||lat>90||lon<-180||lon>180)return NextResponse.json({error:'Invalid location.'},{status:400});
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1&zoom=18`,{headers:{accept:'application/json','User-Agent':'Priyasa-Commerce/1.0 contact@priyasa.com'},next:{revalidate:3600}});
    if(!r.ok)throw new Error('Location lookup unavailable'); const d=await r.json(); const a=d?.address||{};
    return NextResponse.json({found:true,displayName:d?.display_name||'',pincode:a.postcode||'',city:a.city||a.town||a.village||a.municipality||a.county||'',state:a.state||'',area:a.suburb||a.neighbourhood||a.city_district||'',country:a.country||'India'});
  }catch(error){console.error('[PRIYASA REVERSE GEO]',error instanceof Error?error.message:error);return NextResponse.json({error:'Unable to detect your location right now.'},{status:502});}
}
