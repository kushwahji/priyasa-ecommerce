# Deployment verification

This document records the staging build verification baseline for the current production deployment.

## Required checks

- Prisma MySQL schema preparation
- Prisma validate and generate
- TypeScript compilation
- Unit tests
- Next.js production build
- Playwright end-to-end suite

Critical checkout and bulk-variant admin pages must remain valid TSX and preserve their API/payment flows.
