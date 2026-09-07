import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdminPermission } from '@/lib/auth';

const schema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  parentId: z.string().optional().or(z.literal('')),
});

export async function PATCH(req: Request) {
  try {
    const session = await requireAdminPermission('products.write');
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid category', details: parsed.error.flatten() }, { status: 400 });
    const data = parsed.data;
    if (data.parentId === data.id) return NextResponse.json({ error: 'A category cannot be its own parent' }, { status: 400 });

    const category = await db.category.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        parentId: data.parentId || null,
      },
    });
    await db.auditLog.create({ data: { userId: session.userId, action: 'UPDATE', entity: 'Category', entityId: category.id } });
    return NextResponse.json({ data: category });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    return NextResponse.json({ error: message.includes('Unique constraint') ? 'Category slug already exists' : message.includes('FORBIDDEN') ? 'Forbidden' : 'Unable to update category' }, { status: message.includes('FORBIDDEN') ? 403 : 409 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireAdminPermission('products.write');
    const id = new URL(req.url).searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: 'Category id is required' }, { status: 400 });

    const category = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    if (category._count.products > 0 || category._count.children > 0) return NextResponse.json({ error: 'Move products and child categories before deleting this category.' }, { status: 409 });

    await db.category.delete({ where: { id } });
    await db.auditLog.create({ data: { userId: session.userId, action: 'DELETE', entity: 'Category', entityId: id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    return NextResponse.json({ error: message.includes('FORBIDDEN') ? 'Forbidden' : 'Unable to delete category' }, { status: message.includes('FORBIDDEN') ? 403 : 409 });
  }
}
