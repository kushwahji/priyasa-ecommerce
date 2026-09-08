import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {requireAdminPermission} from '@/lib/auth';
export async function GET(){try{await requireAdminPermission('payments.read');const [pending,failed,captured,refunded,refunds]=await Promise.all([db.payment.count({where:{status:'PENDING'}}),db.payment.count({where:{status:'FAILED'}}),db.payment.count({where:{status:'CAPTURED'}}),db.payment.count({where:{status:{in:['REFUNDED','PARTIALLY_REFUNDED']}}}),db.refund.aggregate({_sum:{amount:true},where:{status:{in:['PROCESSED','PENDING']}}})]);return NextResponse.json({data:{pending,failed,captured,refunded,refundAmount:refunds._sum.amount||0}});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to load payment reconciliation'},{status:403});}}
