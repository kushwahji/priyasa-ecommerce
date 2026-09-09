import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdminPermission } from '@/lib/auth';

const schema = z.object({ price: z.number().int().min(0).max(10000000).optional(), stock: z.number().int().min(0).max(100000).optional() }).refine((v) => v.price !== undefined || v.stock !== undefined, { message: 'At least one field is required' });

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminPermission('products.write');
    const { id } = await context.params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid variant update', details: parsed.error.flatten() }, { status: 400 });
    const existing = await db.productVariant.findUnique({ where: { id }, select: { id: true, stock: true, reserved: true, sku: true } });
    if (!existing) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    if (parsed.data.stock !== undefined && parsed.data.stock < existing.reserved) return NextResponse.json({ error: `Stock cannot be lower than reserved quantity (${existing.reserved}).` }, { status: 409 });
    const updated = await db.productVariant.update({ where: { id }, data: parsed.data });
    if (parsed.data.stock !== undefined && parsed.data.stock !== existing.stock) await db.inventoryMovement.create({ data: { variantId: id, quantity: parsed.data.stock - existing.stock, reason: 'ADMIN_QUICK_UPDATE', referenceId: session.userId } });
    await db.auditLog.create({ data: { userId: session.userId, action: 'VARIANT_QUICK_UPDATE', entity: 'ProductVariant', entityId: id, metadata: { sku: existing.sku, fields: Object.keys(parsed.data) } } });
    return NextResponse.json({ data: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unable to update variant';
    return NextResponse.json({ error: message.includes('FORBIDDEN') ? 'Forbidden' : message }, { status: message.includes('FORBIDDEN') ? 403 : 409 });
  }
}
