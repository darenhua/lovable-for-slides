# Frontend Patterns

## Frontend API Client (ORPC + TanStack Query)

**Client Setup:** `apps/web/src/utils/orpc.ts`

Exports:
- `client` - Raw ORPC client
- `orpc` - TanStack Query utilities
- `queryClient` - Global query client

**Usage in Components:**
```typescript
import { orpc } from "@/utils/orpc";

// Query
const data = useQuery(orpc.myRouter.myProcedure.queryOptions());

// Mutation
const mutation = useMutation({
  mutationFn: (input) => orpc.myRouter.myProcedure.mutate(input),
});
```

**Type Safety:**
Client is fully typed from `AppRouterClient` - no manual type definitions needed.

## UI Components (ShadCN)

**Location:** `apps/web/src/components/ui/`

- New York style preset
- Install new components: `npx shadcn@latest add [component]`
- Configuration: `apps/web/components.json`
- Uses `@/` alias for imports

**Component Aliases:**
- `@/components` → `apps/web/src/components`
- `@/lib` → `apps/web/src/lib`
- `@/utils` → `apps/web/src/utils`
