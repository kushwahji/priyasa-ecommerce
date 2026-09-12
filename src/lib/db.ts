/**
 * Legacy database compatibility guard.
 *
 * Priyasa Store no longer owns a commerce database. All commerce/customer
 * state belongs to Priyasa Core API. A small callable proxy remains only so
 * retired legacy routes can compile while they are removed from the Store.
 * It deliberately throws at runtime instead of silently creating a second
 * source of truth.
 */
const legacyDbCall = function legacyDbCall(): never {
  throw new Error('LEGACY_STORE_DATABASE_DISABLED: use Priyasa Core API');
};

const proxy = new Proxy(legacyDbCall, {
  get() {
    return proxy;
  },
  apply() {
    return legacyDbCall();
  },
});

export const db: any = proxy;
