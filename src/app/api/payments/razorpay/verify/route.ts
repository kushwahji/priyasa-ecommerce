import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hmacSha256, safeEqual } from '@/lib/crypto';
import { recordOrderStatus } from '@/lib/order-state';
import { emitOrderEvent } from '@/lib/events';

export async function POST(req:Request){
 const body=await req.json().catch(()=>null); const {orderId,razorpay_order_id,razorpay_payment_id,razorpay_signature}=body||{};
 if(!orderId||!razorpay_order_id||!razorpay_payment_id||!razorpay_signature)return NextResponse.json({error:'Missing payment verification fields'},{status:400});
 const payment=await db.payment.findUnique({where:{orderId},include:{order:true}}); if(!payment)return NextResponse.json({error:'Payment not found'},{status:404});
 if(payment.providerOrderId!==razorpay_order_id)return NextResponse.json({error:'Payment/order mismatch'},{status:400});
 if(!process.env.RAZORPAY_KEY_SECRET)return NextResponse.json({error:'Payment provider not configured'},{status:503});
 const expected=hmacSha256(`${razorpay_order_id}|${razorpay_payment_id}`,process.env.RAZORPAY_KEY_SECRET);if(!safeEqual(expected,razorpay_signature))return NextResponse.json({error:'Invalid payment signature'},{status:401});
 if(payment.status==='CAPTURED')return NextResponse.json({ok:true,alreadyProcessed:true,orderNumber:payment.order.orderNumber});
 const r=await db.$transaction(async tx=>{const fresh=await tx.payment.findUnique({where:{id:payment.id}});if(!fresh)throw new Error('PAYMENT_NOT_FOUND');if(fresh.status==='CAPTURED')return;await tx.payment.update({where:{id:payment.id},data:{providerPaymentId:razorpay_payment_id,status:'CAPTURED',signatureVerified:true}});await tx.paymentEvent.create({data:{provider:'razorpay',eventId:`verify_${razorpay_payment_id}`,eventType:'payment.verify',payload:body,paymentId:payment.id}});});
 await recordOrderStatus(orderId,'CONFIRMED'); await emitOrderEvent(orderId,'PAYMENT_CAPTURED'); await emitOrderEvent(orderId,'ORDER_CONFIRMED');
 return NextResponse.json({ok:true,orderNumber:payment.order.orderNumber});
}
