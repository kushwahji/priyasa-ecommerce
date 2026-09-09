'use client';

import AdminResponsiveNav from '@/components/AdminResponsiveNav';
import CmsStudioV2 from '@/components/CmsStudioV2';
import ManagedProductCollections from '@/components/ManagedProductCollections';
import './cms-v2.css';

export default function Cms() {
  return <div className="cmsAdminShell"><AdminResponsiveNav name="Admin" /><main className="cmsAdminMain"><CmsStudioV2 /><ManagedProductCollections /></main></div>;
}
