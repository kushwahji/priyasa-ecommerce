import { shiprocket } from './shiprocket';
import { shipprime } from './shipprime';
export const shippingProviders={shiprocket,shipprime};
export function getShippingProvider(key:string){const p=(shippingProviders as Record<string,any>)[key];if(!p)throw new Error(`UNKNOWN_SHIPPING_PROVIDER:${key}`);return p;}
export function defaultShippingProvider(){return process.env.SHIPPING_PROVIDER||'shiprocket';}
