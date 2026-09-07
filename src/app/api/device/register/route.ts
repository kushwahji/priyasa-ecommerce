import {NextResponse} from 'next/server';
import {priyasaApi,apiError} from '@/lib/priyasa-api';
export async function POST(req:Request){try{const body=await req.json();const {response,result}=await (async()=>{const x=await priyasaApi(process.env.PRIYASA_DEVICE_REGISTER_PATH||'/api/device/register',{method:'POST',body:JSON.stringify(body)});return {response:x.response,result:x.body}})();return NextResponse.json(result,{status:response.status});}catch(error){return NextResponse.json({success:false,message:apiError(error,'Unable to register device')},{status:502});}}
