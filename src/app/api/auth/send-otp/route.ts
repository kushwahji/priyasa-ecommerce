import {NextResponse} from 'next/server';
import {priyasaApi,apiError} from '@/lib/priyasa-api';

export async function POST(req:Request){
  try{
    const body=await req.json();
    const {response,body:result}=await priyasaApi('/api/v1/auth/send-otp',{method:'POST',body:JSON.stringify(body)});
    return NextResponse.json(result,{status:response.status});
  }catch(error){return NextResponse.json({success:false,message:apiError(error,'Unable to send OTP')},{status:502});}
}
