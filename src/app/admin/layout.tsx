import type { ReactNode } from 'react';

/** Admin modules own their operational shell; the root stylesheet supplies the shared Priyasa design system. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
