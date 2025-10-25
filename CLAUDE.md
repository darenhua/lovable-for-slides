# Codebase Patterns & Architecture

## Monorepo Structure

This is a Turborepo monorepo using Bun as the package manager.

**Apps:**
- `apps/web/` - Next.js 16 frontend with App Router

**Packages:**
- `packages/db/` - Drizzle ORM schemas and database client
- `packages/api/` - ORPC API definitions and routers
- `packages/auth/` - Better Auth configuration

**Workspace References:**
Packages are referenced in `package.json` as `@my-better-t-app/[name]` with `workspace:*` protocol.

## Database Patterns (Drizzle ORM)

**Schema Location:** `packages/db/src/schema/`

Each schema file exports table definitions using Drizzle's schema builders:
```typescript
export const tableName = pgTable("table_name", {
  id: uuid("id").primaryKey().defaultRandom(),
  // ... other columns
});
```

**Workflow for New Tables:**
1. Create schema file in `packages/db/src/schema/[name].ts`
2. Export schema from `packages/db/src/index.ts`
3. Generate migration: `bun run db:generate`
4. Apply migration: `bun run db:migrate`

**Configuration:**
- Drizzle config: `packages/db/drizzle.config.ts`
- Reads env from `apps/web/.env`
- Outputs migrations to `packages/db/src/migrations/`

**Database Management:**
- `bun run db:studio` - Open Drizzle Studio
- `bun run db:push` - Push schema without migrations
- Local Postgres via Supabase on port 54322

## API Patterns (ORPC)

**Router Location:** `packages/api/src/routers/`

Each router exports an object with procedures:
```typescript
export const myRouter = {
  myProcedure: publicProcedure
    .input(z.object({ ... }))
    .handler(async ({ input, context }) => {
      // implementation
    }),
};
```

**Main Router:** `packages/api/src/routers/index.ts`
- Imports all sub-routers
- Exports `appRouter` object
- Exports `AppRouter` and `AppRouterClient` types

**Procedures:**
- `publicProcedure` - No authentication required
- `protectedProcedure` - Requires authenticated user in context

**API Endpoint:** `/api/rpc` handled by `apps/web/src/app/api/rpc/[[...rest]]/route.ts`

## Supabase Local Development

**Location:** `packages/db/supabase/`

**Configuration:** `supabase/config.toml`

**Important:** Supabase is ONLY used for storage buckets and client-side file uploads via the Supabase SDK. Always use Drizzle from API routes for database access, never the Supabase SDK.

**Bucket Configuration:**
Define storage buckets in config:
```toml
[storage.buckets.bucket_name]
public = true
file_size_limit = "50MiB"
allowed_mime_types = ["type/subtype"]
```

Restart Supabase after config changes: (note, you must be in the packages/db folder to run this command)
```bash
supabase seed buckets
```

**Ports:**
- API: 54321
- Database: 54322
- Studio: 54323

**Client Usage:**
Create client in `apps/web/src/lib/` using `@supabase/supabase-js` with `NEXT_PUBLIC_*` env vars for client-side storage access only.

## Environment Variables

**Location:** `apps/web/.env`

- Database packages read from this location (via dotenv in `drizzle.config.ts`)
- Client-side variables must use `NEXT_PUBLIC_` prefix
- Local Supabase anon key is standard for all local dev

## Development Scripts

**Root level: IMPORTANT these must be run in the root folder, NOT the app/web folder. So make sure you're in the root folder first.**
- `bun run dev` - Start the fullstack nextjs app (you want to make sure this runs)
- `bun run check` - Biome format & lint
- `bun run check-types` - TypeScript check

**Database: IMPORTANT these must be run in the packages/db folder so make sure you're in that folder first**
- `bun run db:generate` - Generate migrations
- `bun run db:migrate` - Apply migrations
- `bun run db:push` - Push schema directly (skip migrations)

## Common Patterns

**Creating a New Feature:**
1. Define database schema in `packages/db/src/schema/`
2. Create ORPC router in `packages/api/src/routers/`
3. Add router to main `appRouter` in `packages/api/src/routers/index.ts`
4. Create page in `apps/web/src/app/[route]/page.tsx`
5. Use ORPC client via `orpc` utils for type-safe API calls

**Adding Third-Party Services:**
- Client libraries go in `apps/web/`
- Create utility in `apps/web/src/lib/`
- Use `NEXT_PUBLIC_` env vars for client-side access
