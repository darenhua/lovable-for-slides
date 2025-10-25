# Routing Patterns

## Next.js App Router

**Location:** `apps/web/src/app/`

- File-based routing: `app/[route]/page.tsx`
- Server components by default
- Add `"use client"` for client components
- API routes: `app/api/[route]/route.ts`

## Authentication Pattern

For protected pages:

```typescript
import { auth } from "@my-better-t-app/auth";
import { headers } from "next/headers";

const session = await auth.api.getSession({
  headers: await headers(),
});

if (!session?.user) {
  redirect("/login");
}
```
