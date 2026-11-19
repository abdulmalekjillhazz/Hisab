import { redirect } from 'next/navigation';
import { requireSuperAdmin } from '@/lib/auth';
import { AdminPanel } from '@/components/admin-panel';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (!await requireSuperAdmin()) redirect('/dashboard');
  return <AdminPanel />;
}
