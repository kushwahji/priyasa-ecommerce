import {NextResponse} from 'next/server';
import {priyasaApi,apiError} from '@/lib/priyasa-api';

export async function POST(req:Request){
  try{
    const body=await req.json();
    const {response,body:result}=await priyasaApi('/api/v1/auth/send-otp',{method:'POST',body:JSON.stringify(body)});
    const data=result as {data?:{request_id?:string;message_id?:string;channel?:string;success?:boolean;retry_after?:number};message?:string};
    console.info('[PRIYASA OTP] provider response',{status:response.status,ok:response.ok,request_id:data.data?.request_id,message_id:data.data?.message_id,channel:data.data?.channel,success:data.data?.success,retry_after:data.data?.retry_after,message:data.message});
    return NextResponse.json(result,{status:response.status});
  }catch(error){
    console.error('[PRIYASA OTP] provider request failed',error instanceof Error?error.message:'unknown error');
    return NextResponse.json({success:false,message:apiError(error,'Unable to send OTP')},{status:502});
  }
}
