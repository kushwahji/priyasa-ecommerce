import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {priyasaApi,apiError} from '@/lib/priyasa-api';
import {db} from '@/lib/db';
import {setSession} from '@/lib/auth';

type ProviderUser={id?:number|string;mobile?:string;phone?:string;name?:string};
type ProviderResult={
  success?:boolean;
  message?:string;
  token?:string;
  access_token?:string;
  accessToken?:string;
  user?:ProviderUser;
  data?:{
    success?:boolean;
    token?:string;
    access_token?:string;
    accessToken?:string;
    token_type?:string;
    user?:ProviderUser;
  };
};

const cookieOptions={
  httpOnly:true,
  secure:process.env.NODE_ENV==='production',
  sameSite:'lax' as const,
  path:'/',
};

function providerToken(result:ProviderResult){
  return result.data?.token || result.data?.access_token || result.data?.accessToken || result.token || result.access_token || result.accessToken || '';
}

function providerUser(result:ProviderResult){
  return result.data?.user || result.user;
}

export async function POST(req:Request){
  try{
    const input=await req.json();
    const {response,body:result}=await priyasaApi('/api/v1/auth/verify-otp',{method:'POST',body:JSON.stringify(input)});
    if(!response.ok)return NextResponse.json(result,{status:response.status});

    const provider=result as ProviderResult;
    const data=provider.data;
    const success=data?.success!==false && provider.success!==false;
    if(!success)return NextResponse.json(result,{status:401});

    // Customer commerce APIs require the Core access token. Never create a
    // web session that looks authenticated when the customer token is absent.
    const token=providerToken(provider);
    if(!token){
      return NextResponse.json({
        success:false,
        code:'CUSTOMER_TOKEN_MISSING',
        message:'OTP verified, but the commerce access token was not returned. Please try signing in again.',
      },{status:502});
    }

    const userInfo=providerUser(provider);
    const phone=String(userInfo?.mobile||userInfo?.phone||input.mobile||'').replace(/\D/g,'').slice(-10);
    if(phone.length!==10)return NextResponse.json({success:false,message:'OTP verified but no valid customer mobile was returned.'},{status:502});

    const user=await db.user.upsert({
      where:{phone},
      update:{name:userInfo?.name||undefined},
      create:{phone,name:userInfo?.name||undefined,role:'CUSTOMER'},
    });

    // Establish the local web session and the Core customer token together.
    await setSession(user);
    const jar=await cookies();
    jar.set('priyasa_access_token',token,{...cookieOptions,maxAge:60*60*24*30});
    jar.set('priyasa_mobile',phone,{...cookieOptions,maxAge:60*60*24*30});
    jar.set('priyasa_local_user_id',user.id,{...cookieOptions,maxAge:60*60*24*30});
    if(userInfo?.id!==undefined)jar.set('priyasa_user_id',String(userInfo.id),{...cookieOptions,maxAge:60*60*24*30});

    return NextResponse.json({
      ...provider,
      data:{...(data||{}),user:userInfo||data?.user},
    },{headers:{'Cache-Control':'no-store'}});
  }catch(error){
    return NextResponse.json({success:false,message:apiError(error,'Unable to verify OTP')},{status:502});
  }
}
