# NextStep Global 2 - Migration Guide & Checklist

## ✅ Completed

### API Infrastructure
- ✅ Package dependencies updated with all necessary libraries
- ✅ Zod schemas (lib/schemas.ts) - complete
- ✅ Server utilities (lib/server/): store.ts, auth.ts, uploads.ts
- ✅ API utilities (lib/api-utils.ts) - helpers for responses and validation
- ✅ Core API routes created:
  - Health check (/api/health)
  - Programs (/api/programs)
  - Inquiries (/api/inquiries)
  - Testimonials (/api/testimonials)
  - Consultants (/api/consultants)
  - Appointments (/api/appointments)
  - Destinations (/api/destinations)
  - Gallery (/api/gallery)
  - Site Content (/api/site-content)
  - Admin Stats (/api/admin/stats)

### Configuration
- ✅ .env.example created with all required environment variables
- ✅ layout.tsx updated with Clerk integration
- ✅ Metadata configured

## ⚠️ TODO - Remaining Work

### 1. Additional API Routes (Medium Priority)
These routes follow the same pattern as those already created. Each file converts an Express route to Next.js:

**Admin/Management Routes:**
```
/app/api/admin-invites/route.ts
/app/api/admin-invites/[inviteId]/route.ts
/app/api/notifications/send/route.ts
/app/api/notification-templates/route.ts
/app/api/notification-templates/[templateId]/route.ts
/app/api/owner-settings/route.ts
/app/api/audit-logs/route.ts
/app/api/student-documents/route.ts
/app/api/student-documents/[documentId]/route.ts
/app/api/users/route.ts (for admin user management)
```

**Pattern for all routes:**
1. Read the original Express route from `/next-step-global-1/server/routes/`
2. Convert GET/POST/PATCH/DELETE methods to Next.js GET/POST/PATCH/DELETE exports
3. Use the Zod schemas from `lib/schemas.ts` for validation
4. Use `getCurrentUser()` for authentication instead of middleware
5. Use `readStore()` and `updateStore()` for data access
6. Return responses using `success()`, `error()`, or `handleApiError()`

**Example conversion pattern:**
```typescript
// Express:
router.get("/", async (req, res) => {
  const store = await readStore();
  res.json(store.items);
});

// Next.js:
export async function GET(request: NextRequest) {
  try {
    const store = await readStore();
    return success(store.items);
  } catch (err) {
    return handleApiError(err);
  }
}
```

### 2. Pages Migration (High Priority)
Transform SPA pages from next-step-global-1 into proper Next.js pages:

**Public Pages (Replace existing or create new):**
- `app/page.tsx` - Home page (currently has basic template)
- `app/about/page.tsx` - About page
- `app/contact/page.tsx` - Contact page
- `app/services/page.tsx` - Services page
- `app/destinations/page.tsx` - Destinations listing
- `app/destinations/[destinationId]/page.tsx` - Destination detail
- `app/sign-in/page.tsx` - Sign in (Clerk handles this)
- `app/sign-up/page.tsx` - Sign up (Clerk handles this)

**Admin Pages:**
- `app/admin/page.tsx` - Dashboard
- `app/admin/appointments/page.tsx`
- `app/admin/audit-logs/page.tsx`
- `app/admin/consultants/page.tsx`
- `app/admin/content/page.tsx`
- `app/admin/destinations/page.tsx`
- `app/admin/documents/page.tsx`
- `app/admin/gallery/page.tsx`
- `app/admin/inquiries/page.tsx`
- `app/admin/notifications/page.tsx`
- `app/admin/pipeline/page.tsx`
- `app/admin/programs/page.tsx`
- `app/admin/settings/page.tsx`
- `app/admin/testimonials/page.tsx`
- `app/admin/users/page.tsx`

**Key Differences from SPA to Next.js pages:**
1. **No Wouter routing** - Use Next.js file-based routing
2. **Data fetching** - Use React Server Components or client-side React Query
3. **Forms** - Continue using React Hook Form + Zod (already set up)
4. **API calls** - Continue using the same endpoints
5. **Components** - Reuse existing components from src/components/

**Page structure example:**
```typescript
// app/destinations/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';

export default function DestinationsPage() {
  const { data: destinations } = useQuery({
    queryKey: ['/api/destinations'],
    queryFn: () => fetch('/api/destinations').then(r => r.json()),
  });

  return (
    <div>
      {/* Page content */}
    </div>
  );
}
```

### 3. Component Migration
**Files to copy/adapt from next-step-global-1:**
- Copy all components from `src/components/` folder to `next-step-global-2/components/`
- Update import paths to use `@/` aliases
- UI components already available (Radix UI is in dependencies)

### 4. Hooks & Utilities
**From src/hooks/ and src/lib/:**
- `use-mobile.tsx` - responsive design hook
- `use-toast.ts` - toast notifications
- `api.ts` - existing API utilities (adapt URLs)
- `runtime.ts` - runtime utilities
- `utils.ts` - general utilities

### 5. Configuration Files
**Still needed:**
- `middleware.ts` - Clerk authentication middleware
- `tsconfig.json` - path aliases (@ = src root)
- `tailwind.config.ts` - already present, may need tweaks
- `next.config.ts` - add image optimization if needed

### 6. Data & Seed
- Create `data/db.json` with initial data, or
- Configure MongoDB connection for production

## Quick Start Instructions

### Setup Local Development:
```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Clerk keys and other configs

# 3. Create data directory for local storage
mkdir -p data

# 4. Start development server
npm run dev
```

### API Endpoints (Already Working):
- GET `/api/health` - Health check
- GET `/api/programs` - List programs
- POST `/api/programs` - Create program (requires auth)
- GET `/api/inquiries` - List inquiries
- POST `/api/inquiries` - Submit inquiry (public)
- And all other routes created above...

### Next Steps:
1. **Create remaining API routes** - Follow the pattern from existing routes
2. **Migrate pages** - Copy page components and adapt them
3. **Setup Clerk** - Create Clerk account and add keys to .env
4. **Setup MongoDB** (optional) - For production data persistence
5. **Test all endpoints** - Use Postman or browser dev tools
6. **Deploy** - Follow Next.js deployment guides (Vercel recommended)

## Code Patterns

### Adding a New API Route:
1. Create directory: `/app/api/[resource]/`
2. Create `route.ts` with GET/POST/PATCH/DELETE handlers
3. For detail routes: `/app/api/[resource]/[id]/route.ts`
4. Use schemas from `lib/schemas.ts` for validation
5. Use `readStore()` and `updateStore()` from `lib/server/store.ts`

### Adding a New Page:
1. Create file: `/app/[path]/page.tsx`
2. Use React Query or server components for data fetching
3. Import components from `components/`
4. Use existing form components and hooks
5. Style with Tailwind CSS (classes already configured)

### Authentication in API Routes:
```typescript
const current = await getCurrentUser();
if (!current) {
  return error("Authentication required", 401);
}
```

## Key Technologies
- **Next.js 16** - App Router with server/client components
- **Clerk** - Authentication & user management
- **MongoDB/JSON** - Data persistence
- **Zod** - Type-safe validation
- **React Hook Form** - Form handling
- **React Query** - Data fetching & caching
- **Radix UI** - Accessible UI components
- **Tailwind CSS** - Styling

## Files Still from Global-1 (Copy/Adapt):
```
src/components/  → components/
src/hooks/       → hooks/
src/lib/         → lib/ (merge with new lib files)
```

Update all imports to use `@/` alias format.
