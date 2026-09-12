import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {priyasaApi,apiError} from '@/lib/priyasa-api';
import {setSession} from '@/lib/auth';

type ProviderResult={success?:boolean;message?:string;data?:{success?:boolean;token?:string;token_type?:string;user?:{id?:number|string;mobile?:string;name?:string;email?:string}}};

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

    // Priyasa Core is the customer/commerce authority. The Store does not
    // create or persist a duplicate local customer row anymore.
    const subject=String(data?.user?.id||phone);
    await setSession({id:subject,role:'CUSTOMER'});
    const jar=await cookies();
    jar.set('priyasa_mobile',phone,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30});
    jar.set('priyasa_local_user_id',subject,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30});
    if(data?.user?.name)jar.set('priyasa_user_name',data.user.name,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30});
    if(data?.user?.email)jar.set('priyasa_user_email',data.user.email,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30});
    if(data?.token){
      jar.set('priyasa_access_token',data.token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30});
      if(data.user?.id)jar.set('priyasa_user_id',String(data.user.id),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30});
    }
    return NextResponse.json(result);
  }catch(error){
    return NextResponse.json({success:false,message:apiError(error,'Unable to verify OTP')},{status:502});
  }
}
