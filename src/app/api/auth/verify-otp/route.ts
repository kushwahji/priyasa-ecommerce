import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {priyasaApi,apiError} from '@/lib/priyasa-api';
import {setSession} from '@/lib/auth';

type ProviderUser={id?:number|string;mobile?:string;name?:string;email?:string};
type ProviderData={success?:boolean;token?:string;token_type?:string;user?:ProviderUser;message?:string};
type ProviderResult={success?:boolean;message?:string;token?:string;user?:ProviderUser;data?:ProviderData};

export async function POST(req:Request){
  try{
    const input=await req.json();
    const {response,body:result}=await priyasaApi('/api/v1/auth/verify-otp',{method:'POST',body:JSON.stringify(input)});
    if(!response.ok)return NextResponse.json(result,{status:response.status});

    const provider=(result&&typeof result==='object'?result:{}) as ProviderResult;
    const data:ProviderData={...(provider.data||{}),success:provider.data?.success??provider.success,token:provider.data?.token??provider.token,user:provider.data?.user??provider.user,message:provider.data?.message??provider.message};
    const success=data.success!==false;
    if(!success)return NextResponse.json(result,{status:401});

    const phone=String(data.user?.mobile||input.mobile||'').replace(/\D/g,'').slice(-10);
    if(phone.length!==10)return NextResponse.json({success:false,message:'OTP verified but no valid customer mobile was returned.'},{status:502});

    const subject=String(data.user?.id||phone);
    await setSession({id:subject,role:'CUSTOMER'});
    const jar=await cookies();
    const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge:60*60*24*30};
    jar.set('priyasa_mobile',phone,cookieOptions);
    jar.set('priyasa_local_user_id',subject,cookieOptions);
    if(data.user?.name)jar.set('priyasa_user_name',data.user.name,cookieOptions);
    if(data.user?.email)jar.set('priyasa_user_email',data.user.email,cookieOptions);
    if(data.token){
      jar.set('priyasa_access_token',data.token,cookieOptions);
      if(data.user?.id)jar.set('priyasa_user_id',String(data.user.id),cookieOptions);
    }
    const responseBody:Record<string,unknown>=provider as Record<string,unknown>;
    return NextResponse.json({...responseBody,success:true,data:{...(provider.data||{}),...data,success:true}});
  }catch(error){
    return NextResponse.json({success:false,message:apiError(error,'Unable to verify OTP')},{status:502});
  }
}
