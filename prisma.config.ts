import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.mysql.prisma',
  datasource: {
    // DATABASE_URL is required for db/migrate commands, but Prisma 7's
    // generate command also loads this config. Keep the URL optional during
    // CI/Hostinger builds where the storefront no longer needs a local DB.
    url: process.env.DATABASE_URL ?? '',
  },
});
