'use client';

import { useState } from 'react';
import { AddToCart } from '@/components/AddToCart';

export function ProductPurchase({ product }: { product: {id:string;name:string;price:number;colors:string[];sizes:string[]} }) {
  const [color,setColor] = useState(product.colors[0] || '');
  const [size,setSize] = useState(product.sizes[0] || '');
  const [qty,setQty] = useState(1);
  return <div className="purchase-panel">
    <div className="option-block"><div className="option-label"><strong>Color</strong><span>{color}</span></div><div className="color-options">{product.colors.map(c=><button key={c} aria-label={c} title={c} className={`color-chip color-${c.toLowerCase().replaceAll(' ','-')} ${color===c?'active':''}`} onClick={()=>setColor(c)}><span/></button>)}</div></div>
    <div className="option-block"><div className="option-label"><strong>Size</strong><button className="size-guide-link" type="button">Size Guide ↗</button></div><div className="size-options">{product.sizes.map(s=><button key={s} className={size===s?'active':''} onClick={()=>setSize(s)}>{s}</button>)}</div></div>
    <div className="quantity-row"><strong>Quantity</strong><div className="qty-control"><button onClick={()=>setQty(Math.max(1,qty-1))}>−</button><span>{qty}</span><button onClick={()=>setQty(qty+1)}>+</button></div></div>
    <div className="purchase-actions"><AddToCart variantId={`${product.id}-${color}-${size}`} productId={product.id} name={`${product.name} · ${color} · ${size}`} price={product.price}/><button className="button dark-button">Buy it now</button></div>
    <div className="purchase-trust"><span>✓ Secure payment</span><span>✓ Easy returns</span><span>✓ Quality checked</span></div>
  </div>;
}
