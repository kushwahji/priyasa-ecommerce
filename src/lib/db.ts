/**
 * @deprecated Storefront no longer owns a database.
 * All commerce state belongs to PriyasaCore at api.priyasa.com.
 * Legacy embedded admin routes are blocked and must not use this.
 */
export const db: any = new Proxy({}, {
  get() {
    throw new Error('Legacy local database access is disabled. Use PriyasaCore APIs.');
  },
});
