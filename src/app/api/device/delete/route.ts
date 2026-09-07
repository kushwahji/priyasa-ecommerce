import {NextResponse} from 'next/server';
import {priyasaApi,apiError} from '@/lib/priyasa-api';
export async function DELETE(req:Request){try{const body=await req.json();const {response,result}=await (async()=>{const x=await priyasaApi('/api/device/delete',{method:'DELETE',body:JSON.stringify(body)});return {response:x.response,result:x.body}})();return NextResponse.json(result,{status:response.status});}catch(error){return NextResponse.json({success:false,message:apiError(error,'Unable to remove device')},{status:502});}}
