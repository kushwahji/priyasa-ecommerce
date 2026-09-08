import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {requireAdminPermission} from '@/lib/auth';

export async function GET(){
  try{
    await requireAdminPermission('marketing.read');
    const [customers,orders,abandoned]=await Promise.all([
      db.user.count({where:{role:'CUSTOMER'}}),
      db.order.count(),
      db.cart.count({where:{items:{some:{}}}})
    ]);
    const repeat=await db.user.count({where:{role:'CUSTOMER',orders:{some:{}}}});
    const delivered=await db.user.count({where:{role:'CUSTOMER',orders:{some:{status:'DELIVERED'}}}});
    return NextResponse.json({data:[
      {key:'all_customers',name:'All customers',description:'Every registered customer',count:customers},
      {key:'buyers',name:'Customers with orders',description:'Customers who have placed at least one order',count:repeat},
      {key:'delivered_buyers',name:'Delivered customers',description:'Customers with at least one delivered order',count:delivered},
      {key:'cart_activity',name:'Cart activity',description:'Carts currently containing items',count:abandoned},
      {key:'repeat_buyers',name:'Repeat buyers',description:'Customers with multiple orders',count:null}
    ]});
  }catch{return NextResponse.json({error:'Forbidden'},{status:403});}
}
