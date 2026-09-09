import type { ReactNode } from 'react';
import '../admin.css';
import '../admin-shell.css';
import '../admin-dashboard.css';
import '../admin-reference.css';
import '../admin-orders-reference-v1.css';
import '../admin-order-detail-v2.css';
import '../customer-crm-reference-v1.css';
import '../admin-products-reference-v1.css';
import '../admin-product-editor-reference-v1.css';
import '../admin-inventory-reference-v1.css';
import '../admin-categories-reference-v1.css';
import '../admin-promotions-reference-v1.css';
import '../admin-cms-reference-v2.css';
import '../admin-marketing-reference-v2.css';
import '../admin-responsive-nav.css';

/** Admin-only stylesheet boundary. Keeps the large operational UI payload out of public storefront routes. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
