import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {priyasaApi,apiError} from '@/lib/priyasa-api';
import {db} from '@/lib/db';
import {setSession} from '@/lib/auth';

type ProviderResult={
  success?:boolean;
  message?:string;
  data?:{
    success?:boolean;
    token?:string;
    token_type?:string;
    user?:{id?:number;mobile?:string;name?:string};
  };
};

export async function POST(req:Request){
  try{
    const input=await req.json();
    const {response,body:result}=await priyasaApi('/api/v1/auth/verify-otp',{method:'POST',body:JSON.stringify(input)});
    if(!response.ok)return NextResponse.json(result,{status:response.status});

    const provider=result as ProviderResult;
    const data=provider.data;
    const success=data?.success!==false && provider.success!==false;
    if(!success)return NextResponse.json(result,{status:401});

    const phone=String(data?.user?.mobile||input.mobile||'').replace(/\D/g,'').slice(-10);
    if(phone.length!==10)return NextResponse.json({success:false,message:'OTP verified but no valid customer mobile was returned.'},{status:502});

    const user=await db.user.upsert({
      where:{phone},
      update:{name:data?.user?.name||undefined},
      create:{phone,name:data?.user?.name||undefined,role:'CUSTOMER'},
    });

    // Always establish Priyasa's own signed session. The upstream API token is
    // optional and must not determine whether the web account is logged in.
    await setSession(user);
    const jar=await cookies();
    jar.set('priyasa_mobile',phone,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30});
    jar.set('priyasa_local_user_id',user.id,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30});

    if(data?.token){
      jar.set('priyasa_access_token',data.token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30});
      if(data.user?.id)jar.set('priyasa_user_id',String(data.user.id),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30});
    }

    return NextResponse.json(result);
  }catch(error){
    return NextResponse.json({success:false,message:apiError(error,'Unable to verify OTP')},{status:502});
  }
}
