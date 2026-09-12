import {NextResponse} from 'next/server';
import {priyasaApi,apiError} from '@/lib/priyasa-api';

type ProviderData={success?:boolean;request_id?:string;message_id?:string;channel?:string;retry_after?:number;message?:string};
type ProviderResult={success?:boolean;message?:string;data?:ProviderData;request_id?:string;message_id?:string;channel?:string;retry_after?:number};

export async function POST(req:Request){
  try{
    const body=await req.json();
    const {response,body:result}=await priyasaApi('/api/v1/auth/send-otp',{method:'POST',body:JSON.stringify(body)});
    const provider=(result||{}) as ProviderResult;
    const data:ProviderData={...(provider.data||{}),success:provider.data?.success??provider.success,request_id:provider.data?.request_id??provider.request_id,message_id:provider.data?.message_id??provider.message_id,channel:provider.data?.channel??provider.channel,retry_after:provider.data?.retry_after??provider.retry_after,message:provider.data?.message??provider.message};
    console.info('[PRIYASA OTP] provider response',{status:response.status,ok:response.ok,request_id:data.request_id,message_id:data.message_id,channel:data.channel,success:data.success,retry_after:data.retry_after,message:data.message});
    if(!response.ok || data.success===false)return NextResponse.json(result||{success:false,message:data.message||'Unable to send OTP'},{status:response.status});
    return NextResponse.json({...provider,success:true,data:{...data,success:true}},{status:response.status});
  }catch(error){
    console.error('[PRIYASA OTP] provider request failed',error instanceof Error?error.message:'unknown error');
    return NextResponse.json({success:false,message:apiError(error,'Unable to send OTP')},{status:502});
  }
}
