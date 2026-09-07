export type Product = {
  id: string; name: string; slug: string; category: string; price: number; mrp: number; badge?: string; image: string; colors: string[]; sizes: string[]; description: string;
};

export const products: Product[] = [
  { id:'anarkali-1', name:'Embroidered Anarkali Suit', slug:'embroidered-anarkali-suit', category:'Ethnic Wear', price:2599, mrp:3499, badge:'24% OFF', image:'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85', colors:['Green','Maroon','Pink'], sizes:['S','M','L','XL','XXL'], description:'Elegant embroidered anarkali suit with dupatta, designed for festive occasions and effortless comfort.' },
  { id:'silk-2', name:'Festive Silk Saree', slug:'festive-silk-saree', category:'Ethnic Wear', price:2999, mrp:3999, badge:'25% OFF', image:'https://images.unsplash.com/photo-1610030469668-8e9e1e4e0f1a?auto=format&fit=crop&w=900&q=85', colors:['Maroon','Pink'], sizes:['Free Size'], description:'A rich festive saree with a refined drape and timeless Indian styling.' },
  { id:'kurti-3', name:'Cotton Kurta Set', slug:'cotton-kurta-set', category:'Ethnic Wear', price:1999, mrp:2499, badge:'20% OFF', image:'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=85', colors:['Beige','Blue'], sizes:['S','M','L','XL'], description:'Soft cotton kurta set made for everyday elegance.' },
  { id:'nightwear-4', name:'Floral Night Suit', slug:'floral-night-suit', category:'Nightwear', price:1799, mrp:2199, image:'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=85', colors:['Peach','Pink'], sizes:['S','M','L','XL'], description:'Comfort-first floral nightwear with a relaxed premium fit.' },
  { id:'lingerie-5', name:'Lace Push Up Bra', slug:'lace-push-up-bra', category:'Lingerie', price:1299, mrp:1599, badge:'19% OFF', image:'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=900&q=85', colors:['Pink','Black','Nude'], sizes:['32B','34B','36B','38B'], description:'Comfortable lace construction with supportive shaping.' },
  { id:'active-6', name:'Performance Active Set', slug:'performance-active-set', category:'Activewear', price:2199, mrp:2999, badge:'27% OFF', image:'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=85', colors:['Black','Wine'], sizes:['S','M','L','XL'], description:'Breathable stretch activewear built for movement.' }
];

export const categories = ['Lingerie','Nightwear','Ethnic Wear','Activewear','Loungewear','Accessories'];
export const categoryChildren = ['Sarees','Kurtis & Kurtas','Salwar Suits','Lehenga Choli','Anarkali','Dupattas','Blouses','Indo Western','Co-ord Sets'];
export const money = (n:number) => `₹${n.toLocaleString('en-IN')}`;
