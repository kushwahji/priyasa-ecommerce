import { PrismaClient } from '@prisma/client';
const db=new PrismaClient();
const products=[
  ['anarkali-1','Embroidered Anarkali Suit','embroidered-anarkali-suit','Ethnic Wear',2599,3499,'Elegant embroidered anarkali suit with dupatta.'],
  ['silk-2','Festive Silk Saree','festive-silk-saree','Ethnic Wear',2999,3999,'A rich festive saree with a refined drape.'],
  ['kurti-3','Cotton Kurta Set','cotton-kurta-set','Ethnic Wear',1999,2499,'Soft cotton kurta set made for everyday elegance.'],
  ['nightwear-4','Floral Night Suit','floral-night-suit','Nightwear',1799,2199,'Comfort-first floral nightwear.'],
  ['lingerie-5','Lace Push Up Bra','lace-push-up-bra','Lingerie',1299,1599,'Comfortable lace construction with supportive shaping.'],
  ['active-6','Performance Active Set','performance-active-set','Activewear',2199,2999,'Breathable stretch activewear built for movement.']
] as const;
async function main(){
  for(const [id,name,slug,category,mrp,salePrice,description] of products){
    const c=await db.category.upsert({where:{slug:category.toLowerCase().replaceAll(' ','-')},update:{},create:{name:category,slug:category.toLowerCase().replaceAll(' ','-')}});
    const p=await db.product.upsert({where:{slug},update:{name,mrp,salePrice,description,categoryId:c.id,active:true},create:{name,slug,description,mrp,salePrice,categoryId:c.id}});
    await db.productVariant.upsert({where:{sku:`PRI-${id.toUpperCase()}-DEFAULT`},update:{stock:100},create:{productId:p.id,sku:`PRI-${id.toUpperCase()}-DEFAULT`,size:'M',color:'Default',stock:100}});
  }
  await db.coupon.upsert({where:{code:'WELCOME10'},update:{},create:{code:'WELCOME10',type:'PERCENTAGE',value:10,minCart:0,startsAt:new Date('2026-01-01'),endsAt:new Date('2030-01-01')}});
}
main().finally(()=>db.$disconnect());
