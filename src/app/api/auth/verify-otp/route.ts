import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

type ProviderResult = {
  success?: boolean;
  message?: string;
  data?: {
    success?: boolean;
    token?: string;
    token_type?: string;
    user?: { id?: number | string; mobile?: string; name?: string };
  };
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
};

export async function POST(req: Request) {
  try {
    const input = await req.json();
    const { response, body: result } = await priyasaApi('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (!response.ok) return NextResponse.json(result, { status: response.status });

    const provider = result as ProviderResult;
    const data = provider.data;
    if (data?.success === false || provider.success === false || !data?.token) {
      return NextResponse.json(result, { status: 401 });
    }

    const jar = await cookies();
    jar.set('priyasa_access_token', data.token, cookieOptions);
    if (data.user?.id != null) jar.set('priyasa_user_id', String(data.user.id), cookieOptions);
    if (data.user?.mobile) jar.set('priyasa_mobile', data.user.mobile.replace(/\D/g, '').slice(-10), cookieOptions);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: apiError(error, 'Unable to verify OTP') },
      { status: 502 },
    );
  }
}
