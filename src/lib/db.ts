/**
 * Local commerce persistence has been retired.
 *
 * Priyasa Core API is the single source of truth for catalog, customer,
 * cart, inventory, checkout, orders, payments, shipping and CMS data.
 *
 * This compatibility facade intentionally fails fast for any legacy route that
 * still attempts to use the old Prisma-shaped `db` object. Such routes must be
 * migrated to the Core API rather than silently creating a second data store.
 */
const disabledDb = new Proxy(function disabledDatabaseAccess() {
  throw new Error('LOCAL_DATABASE_DISABLED: use Priyasa Core API');
} as unknown as Record<string, unknown>, {
  get(_target, property) {
    if (property === 'then') return undefined;
    return new Proxy(function disabledModelAccess() {
      throw new Error(`LOCAL_DATABASE_DISABLED: db.${String(property)} must use Priyasa Core API`);
    } as unknown as Record<string, unknown>, {
      get(_modelTarget, method) {
        if (method === 'then') return undefined;
        return (..._args: unknown[]) => {
          throw new Error(`LOCAL_DATABASE_DISABLED: db.${String(property)}.${String(method)} must use Priyasa Core API`);
        };
      },
    });
  },
});

export const db = disabledDb as any;
