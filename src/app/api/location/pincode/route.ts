import {NextResponse} from 'next/server';

export const dynamic='force-dynamic';

export async function GET(req:Request){
  const pincode=(new URL(req.url).searchParams.get('pincode')||'').replace(/\D/g,'');
  if(!/^\d{6}$/.test(pincode)) return NextResponse.json({error:'Enter a valid 6-digit pincode.'},{status:400});
  try{
    const r=await fetch(`https://api.postalpincode.in/pincode/${pincode}`,{headers:{accept:'application/json'},next:{revalidate:86400}});
    if(!r.ok) throw new Error('Pincode service unavailable');
    const data=await r.json();
    const record=data?.[0];
    const office=record?.PostOffice?.[0];
    if(record?.Status!=='Success'||!office) return NextResponse.json({found:false,message:'Pincode not found.'},{status:404});
    return NextResponse.json({found:true,pincode,city:office.District||office.Block||'',state:office.State||'',stateCode:office.StateCode||'',country:office.Country||'India',area:office.Name||office.Block||'',postOffices:record.PostOffice?.slice(0,8).map((x:any)=>x.Name).filter(Boolean)||[]},{headers:{'Cache-Control':'public, max-age=86400, stale-while-revalidate=604800'}});
  }catch(error){
    console.error('[PRIYASA PINCODE]',error instanceof Error?error.message:error);
    return NextResponse.json({error:'Unable to look up this pincode right now.'},{status:502});
  }
}
