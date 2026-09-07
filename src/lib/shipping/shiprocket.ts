import type { ShippingProvider, ShipmentInput } from './types';
const base='https://apiv2.shiprocket.in/v1/external';
let cached:{token:string;expires:number}|null=null;
async function json(path:string,init:RequestInit={}){const r=await fetch(base+path,{...init,headers:{'Content-Type':'application/json',...(init.headers||{})}});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`SHIPROCKET_${r.status}: ${data.message||'request failed'}`);return data;}
async function token(){if(cached&&cached.expires>Date.now()+60000)return cached.token;const email=process.env.SHIPROCKET_EMAIL,password=process.env.SHIPROCKET_PASSWORD;if(!email||!password)throw new Error('SHIPROCKET_NOT_CONFIGURED');const d=await json('/auth/login',{method:'POST',body:JSON.stringify({email,password})});cached={token:d.token,expires:Date.now()+9*24*60*60*1000};return d.token;}
async function auth(path:string,init:RequestInit={}){const t=await token();return json(path,{...init,headers:{...(init.headers||{}),Authorization:`Bearer ${t}`}});}

export async function checkPincode(input:{pickupPincode:string;deliveryPincode:string;weightGrams:number;cod:boolean}){
  const q=new URLSearchParams({pickup_postcode:input.pickupPincode,delivery_postcode:input.deliveryPincode,weight:String(Math.max(input.weightGrams,100)/1000),cod:input.cod?'1':'0'});
  const d=await auth(`/courier/serviceability/?${q}`);
  const rows=Array.isArray(d?.data?.available_courier_companies)?d.data.available_courier_companies:[];
  const couriers=rows.slice(0,8).map((x:any)=>({name:x.courier_name,rate:Number(x.rate||0),etaDays:Number.parseInt(String(x.etd||''),10)||undefined,codAvailable:Boolean(x.cod===1||x.cod===true||x.cod===input.cod),rating:Number(x.rating||0)}));
  const best=couriers[0];
  return {
    serviceable:couriers.length>0,
    amount:best?.rate||0,
    etaDays:best?.etaDays,
    courier:best?.name,
    codAvailable:couriers.some(x=>x.codAvailable),
    couriers
  };
}

export const shiprocket:ShippingProvider={
 key:'shiprocket',
 async testConnection(){try{await token();return true}catch{return false}},
 async getServiceability(i){const x=await checkPincode(i);return{serviceable:x.serviceable,amount:x.amount,etaDays:x.etaDays,courier:x.courier};},
 async createShipment(i:ShipmentInput){const d=await auth('/orders/create/adhoc',{method:'POST',body:JSON.stringify({order_id:i.orderNumber,order_date:new Date().toISOString().slice(0,19).replace('T',' '),pickup_location:process.env.SHIPROCKET_PICKUP_LOCATION||'Primary',billing_customer_name:i.address.fullName,billing_last_name:'',billing_address:i.address.line1,billing_address_2:i.address.line2||'',billing_city:i.address.city,billing_pincode:i.address.pincode,billing_state:i.address.state,billing_country:'India',billing_email:process.env.SHIPROCKET_DEFAULT_EMAIL||'orders@priyasa.com',billing_phone:i.address.phone,shipping_is_billing:1,order_items:i.items.map(x=>({name:x.name,sku:x.sku,units:x.quantity,selling_price:x.unitPrice})),payment_method:i.paymentMethod==='COD'?'COD':'Prepaid',sub_total:i.subtotal,shipping_charges:i.shipping,weight:(i.weightGrams||500)/1000,length:i.lengthCm||20,breadth:i.breadthCm||15,height:i.heightCm||5})});return{provider:'shiprocket',shipmentId:String(d.order_id||'')};},
 async assignAwb(shipmentId,courierId){const d=await auth('/courier/assign/awb',{method:'POST',body:JSON.stringify({shipment_id:shipmentId,courier_id:courierId})});const x=d?.response?.data;return{provider:'shiprocket',shipmentId,awb:x?.awb_code,carrier:x?.courier_name,trackingUrl:x?.awb_code?`https://shiprocket.co/tracking/${x.awb_code}`:undefined};},
 async requestPickup(shipmentId){await auth('/courier/generate/pickup',{method:'POST',body:JSON.stringify({shipment_id:[shipmentId]})});return{provider:'shiprocket',shipmentId};},
 async generateLabel(shipmentId){const d=await auth('/courier/generate/label',{method:'POST',body:JSON.stringify({shipment_id:[shipmentId]})});return{labelUrl:d?.label_url||d?.response?.label_url};},
 async track(awb){const d=await auth(`/courier/track/awb/${encodeURIComponent(awb)}`);const x=d?.tracking_data?.shipment_track?.[0]||{};return{status:String(x.current_status||x.status||'UNKNOWN'),location:x.location,description:x.activity,occurredAt:x.date};},
 async cancelShipment(shipmentId){await auth('/orders/cancel',{method:'POST',body:JSON.stringify({ids:[shipmentId]})});}
};
