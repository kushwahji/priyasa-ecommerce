'use client';

import AdminResponsiveNav from '@/components/AdminResponsiveNav';
import AdminBulkVariantsV2 from '@/components/AdminBulkVariantsV2';
import './variant-ops-v2.css';

export default function BulkVariants() {
  return <div className="variantAdminShell"><AdminResponsiveNav name="Admin" /><main><AdminBulkVariantsV2 /></main></div>;
}
