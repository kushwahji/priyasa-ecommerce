import {NextResponse} from 'next/server';
import {priyasaApi,apiError} from '@/lib/priyasa-api';
export async function POST(req:Request){try{const body=await req.json();const {response,result}=await (async()=>{const x=await priyasaApi('/api/device/logout',{method:'POST',body:JSON.stringify(body)});return {response:x.response,result:x.body}})();return NextResponse.json(result,{status:response.status});}catch(error){return NextResponse.json({success:false,message:apiError(error,'Unable to logout device')},{status:502});}}
