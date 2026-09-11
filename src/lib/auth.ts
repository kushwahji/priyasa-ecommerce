import { cookies } from 'next/headers';
import { priyasaApi } from '@/lib/priyasa-api';

export type StoreSession = {
  userId: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
  phone?: string | null;
  email?: string | null;
};

export async function getSession(): Promise<StoreSession | null> {
  const jar = await cookies();
  const token = jar.get('priyasa_access_token')?.value;
  if (!token) return null;

  try {
    const { response, body } = await priyasaApi('/api/v1/storefront/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = (body as any)?.data;
    if (!response.ok || !user?.id) return null;

    return {
      userId: String(user.id),
      role: 'CUSTOMER',
      phone: user.phone ?? null,
      email: user.email ?? null,
    };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const jar = await cookies();
  for (const name of ['priyasa_session', 'priyasa_access_token', 'priyasa_user_id', 'priyasa_mobile', 'priyasa_local_user_id']) {
    jar.set(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }
}

/** @deprecated Administration is owned by priyasa-admin/Core. */
export async function setSession(_user: { id: string; role: string }) {
  throw new Error('Store-owned admin sessions are disabled. Use PRIYASA Admin/Core authentication.');
}

/** @deprecated Administration is owned by priyasa-admin/Core. */
export async function ensureAdminFromEnvironment(): Promise<never> {
  throw new Error('Store-owned admin authentication is disabled.');
}

export async function requireAdmin(): Promise<never> {
  throw new Error('Store-owned administration is disabled.');
}

export async function requireAdminPermission(_permission: string): Promise<never> {
  throw new Error('Store-owned administration is disabled.');
}
