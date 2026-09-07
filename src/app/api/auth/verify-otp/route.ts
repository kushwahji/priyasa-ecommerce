import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {priyasaApi,apiError} from '@/lib/priyasa-api';

export async function POST(req:Request){
  try{
    const input=await req.json();
    const {response,body:result}=await priyasaApi('/api/v1/auth/verify-otp',{method:'POST',body:JSON.stringify(input)});
    if(!response.ok)return NextResponse.json(result,{status:response.status});
    const data=(result as {data?:{token?:string;token_type?:string;user?:{id?:number;mobile?:string}}})?.data;
    if(data?.token){
      (await cookies()).set('priyasa_access_token',data.token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30});
      if(data.user?.id)(await cookies()).set('priyasa_user_id',String(data.user.id),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30});
      if(data.user?.mobile)(await cookies()).set('priyasa_mobile',data.user.mobile,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30});
    }
    return NextResponse.json(result);
  }catch(error){return NextResponse.json({success:false,message:apiError(error,'Unable to verify OTP')},{status:502});}
}
