import {db} from '../src/lib/db';

const demoProductSlugs=[
 'embroidered-anarkali-suit',
 'festive-silk-saree',
 'cotton-kurta-set',
 'floral-night-suit',
 'lace-push-up-bra',
 'performance-active-set',
];

const demoCmsKeys=['home.hero','offers.hero','offers.popup','shop.hero'];

async function main(){
 const result=await db.$transaction(async tx=>{
  const products=await tx.product.updateMany({where:{slug:{in:demoProductSlugs}},data:{active:false}});
  const cms=await tx.cmsSection.deleteMany({where:{key:{in:demoCmsKeys}}});
  const coupon=await tx.coupon.updateMany({where:{code:'WELCOME10'},data:{active:false}});
  return {deactivatedProducts:products.count,removedCmsSections:cms.count,deactivatedCoupons:coupon.count};
 });
 console.log('Demo storefront cleanup complete.');
 console.log(JSON.stringify(result,null,2));
}

main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>db.$disconnect());
