import Link from 'next/link';
import WooCommerceImportPanel from '@/components/WooCommerceImportPanel';

export default function WooCommerceImportPage(){
 return <div className="admin-shell"><aside className="admin-nav"><h2>PRIYASA Admin</h2><Link href="/admin">← Dashboard</Link><Link href="/admin/products">Products</Link><Link href="/admin/products/new">Add Product</Link><Link href="/admin/products/import">Import CSV</Link><Link href="/admin/products/woocommerce">WooCommerce Import</Link><Link href="/admin/categories">Categories</Link><Link href="/admin/inventory">Inventory</Link></aside><section className="admin-main"><div className="section-head"><div><h1>WooCommerce Catalog Import</h1><p className="muted">Safely copy the live WooCommerce catalog into the Priyasa database. This does not modify WooCommerce.</p></div></div><WooCommerceImportPanel/></section></div>;
}
