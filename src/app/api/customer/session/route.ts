import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {db} from '@/lib/db';
export async function GET(){const jar=await cookies();const id=jar.get('priyasa_local_user_id')?.value;const externalId=jar.get('priyasa_user_id')?.value;const phone=jar.get('priyasa_mobile')?.value;if(!id&&!phone)return NextResponse.json({authenticated:false});const user=id?await db.user.findUnique({where:{id},select:{id:true,name:true,phone:true,email:true}}):await db.user.findUnique({where:{phone},select:{id:true,name:true,phone:true,email:true}});if(!user)return NextResponse.json({authenticated:false});return NextResponse.json({authenticated:true,user:{...user,externalId:externalId||null}});}
