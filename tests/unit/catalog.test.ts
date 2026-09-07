import {describe,it,expect} from 'vitest';
import {money} from '@/lib/catalog';

describe('catalog helpers',()=>{
  it('formats INR prices',()=>{expect(money(2599)).toBe('₹2,599')});
  it('formats zero and large INR prices consistently',()=>{
    expect(money(0)).toBe('₹0');
    expect(money(1000000)).toBe('₹10,00,000');
  });
});
