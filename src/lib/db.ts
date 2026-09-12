/**
 * Legacy database compatibility guard.
 * Priyasa Store no longer owns a commerce database; Core API is authoritative.
 * Retired legacy modules can compile while they are migrated to Core endpoints.
 */
const legacyDbCall = function legacyDbCall(): never {
  throw new Error('LEGACY_STORE_DATABASE_DISABLED: use Priyasa Core API');
};

const proxy: any = new Proxy(legacyDbCall, {
  get() { return proxy; },
  apply() { return legacyDbCall(); },
});

export const db: any = proxy;
