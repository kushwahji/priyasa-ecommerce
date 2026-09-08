import type { ReactNode } from 'react';

/**
 * Admin pages own their operational shell so legacy and modern modules can
 * coexist while sharing the same global Priyasa reference styling.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
