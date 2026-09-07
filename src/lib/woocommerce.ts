type WooCategory={id:number;name:string;slug:string;parent:number;description?:string;image?:{src?:string;alt?:string}|null;menu_order?:number};
type WooImage={id:number;src:string;alt?:string;name?:string;position?:number};
type WooAttribute={name:string;variation?:boolean;options?:string[]};
type WooVariation={id:number;sku:string;regular_price:string;sale_price:string;price:string;manage_stock:boolean|string;stock_quantity:number|null;in_stock:boolean;weight?:string;image?:{src?:string;alt?:string}|null;attributes:Array<{name:string;option:string}>};
type WooProduct={id:number;name:string;slug:string;description:string;short_description?:string;status:string;catalog_visibility?:string;featured?:boolean;categories:Array<{id:number;name:string;slug:string}>;images:WooImage[];attributes:WooAttribute[];variations:number[];type:string;sku:string;regular_price:string;sale_price:string;price:string;manage_stock:boolean;stock_quantity:number|null;in_stock:boolean;weight?:string;dimensions?:{length?:string;width?:string;height?:string};meta_data?:Array<{key:string;value:unknown}>};

function config(){
 const base=process.env.WOOCOMMERCE_URL?.replace(/\/$/,'');
 const key=process.env.WOOCOMMERCE_CONSUMER_KEY;
 const secret=process.env.WOOCOMMERCE_CONSUMER_SECRET;
 if(!base||!key||!secret)throw new Error('WooCommerce integration is not configured. Set WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY and WOOCOMMERCE_CONSUMER_SECRET.');
 return {base,key,secret};
}

async function wcGet<T>(path:string,params:Record<string,string|number|boolean|undefined>={}){
 const {base,key,secret}=config();
 const url=new URL(`${base}/wp-json/wc/v3/${path.replace(/^\//,'')}`);
 for(const [k,v] of Object.entries(params))if(v!==undefined)url.searchParams.set(k,String(v));
 const auth=Buffer.from(`${key}:${secret}`).toString('base64');
 const res=await fetch(url,{headers:{Authorization:`Basic ${auth}`,Accept:'application/json'},cache:'no-store'});
 const text=await res.text();
 if(!res.ok)throw new Error(`WooCommerce ${res.status}: ${text.slice(0,500)}`);
 return {data:JSON.parse(text) as T,totalPages:Number(res.headers.get('X-WP-TotalPages')||'1'),total:Number(res.headers.get('X-WP-Total')||'0')};
}

async function all<T>(path:string,params:Record<string,string|number|boolean|undefined>={},pageSize=100){
 const first=await wcGet<T[]>(path,{...params,page:1,per_page:pageSize});
 const out=[...first.data];
 for(let page=2;page<=first.totalPages;page++)out.push(...(await wcGet<T[]>(path,{...params,page,per_page:pageSize})).data);
 return {data:out,total:first.total||out.length};
}

export async function getWooCategories(){return all<WooCategory>('products/categories',{orderby:'id',order:'asc'});}
export async function getWooProducts(){return all<WooProduct>('products',{status:'any',orderby:'id',order:'asc'});}
export async function getWooVariations(productId:number){return all<WooVariation>(`products/${productId}/variations`,{orderby:'id',order:'asc'});}
export type {WooCategory,WooImage,WooProduct,WooVariation};
