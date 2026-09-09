import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import AdminDashboardV4 from '@/components/AdminDashboardV4';
import './dashboard-v4.css';

export default async function Admin() {
  const session = await getSession();
  if (!session || !['ADMIN', 'STAFF'].includes(session.role)) redirect('/admin/login');
  const admin = await db.user.findUnique({ where: { id: session.userId }, select: { name: true, email: true } });
  return <AdminDashboardV4 name={admin?.name || 'Admin'} email={admin?.email} />;
}
