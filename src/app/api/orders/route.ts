import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const schema=z.object({phone:z.string().regex(/^\+?\d{10,15}$/),fullName:z.string().min(2),line1:z.string().min(3),city:z.string().min(2),state:z.string().min(2),pincode:z.string().regex(/^\d{6}$/),items:z.array(z.object({variantId:z.string(),quantity:z.number().int().min(1).max(20)})).min(1),coupon:z.string().trim().optional()});

export async function POST(req:Request){
  const parsed=schema.safeParse(await req.json()); if(!parsed.success)return NextResponse.json({error:'Invalid checkout data',details:parsed.error.flatten()},{status:400});
  const data=parsed.data;
  try{
    const result=await db.$transaction(async tx=>{
      const variants=await tx.productVariant.findMany({where:{id:{in:data.items.map(i=>i.variantId)}},include:{product:true}});
      if(variants.length!==data.items.length)throw new Error('One or more products are unavailable');
      const lines=data.items.map(i=>{const v=variants.find(x=>x.id===i.variantId)!;if(v.stock-v.reserved<i.quantity)throw new Error(`${v.product.name} is out of stock`);return {...i,v};});
      const subtotal=lines.reduce((s,x)=>s+(x.v.price??x.v.product.salePrice)*x.quantity,0);
      let discount=0;
      let couponCode:string|undefined;
      if(data.coupon){const c=await tx.coupon.findUnique({where:{code:data.coupon.toUpperCase()}});const now=new Date();if(c&&c.active&&now>=c.startsAt&&now<=c.endsAt&&subtotal>=c.minCart&&(!c.maxUses||c.usedCount<c.maxUses)){couponCode=c.code;discount=c.type==='PERCENTAGE'?Math.floor(subtotal*c.value/100):Math.min(c.value,subtotal);}}
      const shipping=subtotal-discount>=999?0:99;const tax=0;const total=Math.max(0,subtotal-discount+shipping+tax);
      const user=await tx.user.upsert({where:{phone:data.phone},update:{name:data.fullName},create:{phone:data.phone,name:data.fullName}});
      const address=await tx.address.create({data:{userId:user.id,fullName:data.fullName,phone:data.phone,line1:data.line1,city:data.city,state:data.state,pincode:data.pincode,isDefault:false}});
      const order=await tx.order.create({data:{orderNumber:`PRI-${Date.now().toString(36).toUpperCase()}`,userId:user.id,addressId:address.id,status:'PAYMENT_PENDING',subtotal,discount,shipping,tax,total,couponCode,items:{create:lines.map(x=>({variantId:x.v.id,productName:x.v.product.name,sku:x.v.sku,size:x.v.size,color:x.v.color,unitPrice:x.v.price??x.v.product.salePrice,quantity:x.quantity}))},payment:{create:{provider:'razorpay',amount:total,status:'PENDING'}}},include:{payment:true}});
      for(const x of lines){await tx.productVariant.update({where:{id:x.v.id},data:{reserved:{increment:x.quantity}}});}
      if(couponCode)await tx.coupon.update({where:{code:couponCode},data:{usedCount:{increment:1}}});
      return order;
    });
    return NextResponse.json({orderId:result.id,orderNumber:result.orderNumber,total:result.total,paymentId:result.payment?.id},{status:201});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to create order'},{status:409});}
}
