import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function POST(req:Request){
  const {orderId}=await req.json(); if(!orderId)return NextResponse.json({error:'orderId required'},{status:400});
  const order=await db.order.findUnique({where:{id:orderId},include:{payment:true}});if(!order)return NextResponse.json({error:'Order not found'},{status:404});
  if(!process.env.RAZORPAY_KEY_ID||!process.env.RAZORPAY_KEY_SECRET)return NextResponse.json({error:'Payment provider is not configured'},{status:503});
  const auth=Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const r=await fetch('https://api.razorpay.com/v1/orders',{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/json'},body:JSON.stringify({amount:order.total*100,currency:'INR',receipt:order.orderNumber,payment_capture:1})});
  if(!r.ok)return NextResponse.json({error:'Unable to create payment order'},{status:502});const data=await r.json();
  await db.payment.update({where:{orderId},data:{providerOrderId:data.id}});
  return NextResponse.json({keyId:process.env.RAZORPAY_KEY_ID,razorpayOrderId:data.id,amount:order.total*100,currency:'INR',orderNumber:order.orderNumber});
}
