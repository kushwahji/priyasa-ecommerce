import {NextResponse} from 'next/server';
import {priyasaApi,apiError} from '@/lib/priyasa-api';
export const dynamic='force-dynamic';
export async function GET(req:Request){
  const url=new URL(req.url);const pincode=(url.searchParams.get('pincode')||'').replace(/\D/g,'');const cod=url.searchParams.get('cod')==='1';
  if(!/^\d{6}$/.test(pincode))return NextResponse.json({serviceable:false,message:'Enter a valid 6-digit delivery pincode.'},{status:400});
  const {response,body}=await priyasaApi(`/api/v1/storefront/shipping/serviceability?pincode=${pincode}&payment_method=${cod?'cod':'razorpay'}`);
  if(!response.ok)return NextResponse.json({serviceable:false,message:apiError(body,'Unable to check delivery right now. Please try again.')},{status:response.status});
  const data:any=(body as any)?.data??body;const options=Array.isArray(data?.options)?data.options:[];const first=options[0];
  return NextResponse.json({serviceable:Boolean(data?.serviceable),pincode,etaDays:first?.estimated_delivery_days??null,etaText:first?.etd?(String(first.etd).match(/\d+/)?.[0]?`Delivery in ${String(first.etd).match(/\d+/)?.[0]} days`:String(first.etd)):undefined,shippingCharge:first?.freight_charge??null,courier:first?.courier??null,couriers:options,codAvailable:Boolean(data?.serviceable&&cod),message:data?.serviceable?'Delivery is available at this pincode.':'Sorry, delivery is not available at this pincode.'},{headers:{'Cache-Control':'private, max-age=60'}});
}
