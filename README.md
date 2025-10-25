# Lovable for Slides

An AI-powered PowerPoint slide generator that helps create variations and intelligently fill template presentations.

## Technical Stack

### Architecture

This project uses a **Turborepo monorepo** structure with workspace packages:

```
my-better-t-app/
├── apps/
│   └── web/              # Next.js frontend + API routes
├── packages/
│   ├── api/              # ORPC procedures & business logic
│   ├── auth/             # Better Auth configuration
│   └── db/               # Database schema & Drizzle ORM
```

### Frontend Tooling

**Next.js App Router (React 19)**
- Uses App Router exclusively (`apps/web/src/app/`)
- Server components by default with selective client components
- React Compiler enabled for automatic optimization
- Typed routes enabled for type-safe navigation
- Dev server runs on port 3001

**React Query + ORPC Integration**
- ORPC provides end-to-end type-safe RPC with OpenAPI support
- Client setup in `apps/web/src/utils/orpc.ts` creates QueryClient and ORPC client
- `apps/web/src/components/providers.tsx` wraps app with QueryClientProvider
- Components use `orpc.procedureName.queryOptions()` with React Query hooks
- Procedures defined in `packages/api/src/routers/index.ts`
- API served via catch-all route at `/api/rpc/*`

**UI Stack**
- TailwindCSS for styling
- shadcn/ui components based on Radix UI
- Dark/light theme support with next-themes
- Sonner for toast notifications

### Backend Tooling

**ORPC API Layer**
- Server initialization in `packages/api/src/index.ts`
- Public procedures: no authentication required
- Protected procedures: use `requireAuth` middleware
- Context creation in `packages/api/src/context.ts` extracts session from headers
- Route handler at `apps/web/src/app/api/rpc/[[...rest]]/route.ts` handles all HTTP methods
- OpenAPI documentation available at `/api/rpc/api-reference`

**Better Auth Authentication**
- Configuration in `packages/auth/src/index.ts`
- Uses Drizzle adapter with PostgreSQL
- Email/password authentication enabled
- Session management via cookies (nextCookies plugin)
- API routes at `/api/auth/*` via catch-all handler
- Frontend client in `apps/web/src/lib/auth-client.ts`

**Authentication Flow**
1. User signs in via frontend → calls `authClient.signIn.email()`
2. Request goes to `/api/auth/[...all]` route handler
3. Better Auth validates credentials and creates session
4. Session stored in database and cookie
5. Protected API routes check session via middleware in context
6. Components access session via `authClient.useSession()` hook

**Database**
- PostgreSQL with Drizzle ORM
- Schema defined in `packages/db/src/schema/`
- Auth tables: `user`, `session`, `account`, `verification`

### Key Technologies

- **TypeScript** - Full type safety across frontend and backend
- **Bun** - Package manager and runtime
- **Biome** - Linting and formatting
- **Vercel AI SDK** - AI streaming responses

## Project Description

**Lovable for Slides** is an AI-powered presentation tool that transforms PowerPoint templates into customized slides.

### Workflow

1. **Upload**: User uploads a PowerPoint template file
2. **Parse**: System reads the template structure and identifies text boxes
3. **Generate**: AI creates multiple variations for each slide
4. **Fill**: AI intelligently replaces text content in template placeholders
5. **Export**: User downloads the completed presentation

### Core Features

- Template-based slide generation
- AI-powered content variation
- Intelligent text replacement in placeholders
- PowerPoint file import/export

The application focuses on smart content generation that respects the design structure of uploaded templates while providing AI-assisted text content creation.

## Getting Started & Development

### Prerequisites

- **Bun** - Install from [bun.sh](https://bun.sh)
- **PostgreSQL** - Database server running locally or remotely

### Initial Setup

1. **Clone and install dependencies**
   ```bash
   bun install
   ```

2. **Configure environment variables**

   Create `apps/web/.env` with:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   DIRECT_URL="postgresql://user:password@localhost:5432/dbname"
   BETTER_AUTH_SECRET="your-secret-key-here"
   BETTER_AUTH_URL="http://localhost:3001"
   CORS_ORIGIN="http://localhost:3001"
   ```

3. **Setup database**
   ```bash
   bun db:push
   ```

### Development

**Start the development server**
```bash
bun dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Available Scripts

- `bun dev` - Start all applications in development mode
- `bun build` - Build all applications for production
- `bun check-types` - Check TypeScript types across all workspaces
- `bun db:push` - Push schema changes to database
- `bun db:studio` - Open Drizzle Studio for database inspection
- `bun check` - Run Biome linting and formatting

### Development Tools

- **React Query Devtools** - Automatically enabled in development
- **Drizzle Studio** - Visual database editor at `bun db:studio`
- **OpenAPI Docs** - API reference at `/api/rpc/api-reference`

### Project Structure

- `apps/web/src/app/` - Next.js pages and API routes
- `apps/web/src/components/` - React components
- `packages/api/src/routers/` - ORPC procedure definitions
- `packages/auth/src/` - Authentication configuration
- `packages/db/src/schema/` - Database schema definitions
