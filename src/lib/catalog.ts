export type Product = {
 id:string;name:string;slug:string;category:string;categorySlug?:string;price:number;mrp:number;badge?:string;image:string;images?:string[];colors:string[];sizes:string[];description:string;variantId?:string;rating?:number;reviewCount?:number;fabric?:string;care?:string;
};
export const money=(n:number)=>`₹${n.toLocaleString('en-IN')}`;
