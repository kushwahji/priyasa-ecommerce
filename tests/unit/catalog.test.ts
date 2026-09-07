import {describe,it,expect} from 'vitest';import {products,money} from '@/lib/catalog';
describe('catalog',()=>{it('has unique product slugs',()=>{expect(new Set(products.map(p=>p.slug)).size).toBe(products.length)});it('formats INR prices',()=>{expect(money(2599)).toBe('₹2,599')})});
