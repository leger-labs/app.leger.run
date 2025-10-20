# CLAUDE.md - Leger v0.1.0 Web Application Implementation

**Document Type:** Implementation Handoff for Claude Code Agent  
**Target:** GitHub Actions Automated Implementation  
**Status:** Ready for Implementation  
**Version:** 1.0

---

## Executive Summary

This document guides the implementation of Leger v0.1.0's remaining frontend components. The backend API is fully implemented, and a comprehensive UI component library exists. Your task is to connect these pieces with data fetching, routing, and page implementations.

**What Exists:**
- ✅ Complete backend API (Cloudflare Workers + KV + D1)
- ✅ 50+ UI components in `src/components/ui/`
- ✅ Brand kit integration (Catppuccin Mocha + Geist fonts)
- ✅ Infrastructure configured (wrangler.toml)

**What You'll Build:**
- ❌ API client (`src/lib/api-client.ts`)
- ❌ Custom hooks (`src/hooks/`)
- ❌ Page components (`src/pages/`)
- ❌ Layout components (`src/components/layout/`)
- ❌ Router configuration (rewrite `src/App.tsx`)
- ❌ TypeScript type definitions (`src/types/`)

---

## Critical Context

### Project Architecture

```
┌─────────────────────────────────────────────────────────┐
│ User's Machine                                           │
│  ┌──────────────┐         ┌──────────────┐             │
│  │ Web Browser  │         │  Leger CLI   │             │
│  │   (React)    │         │   (Go)       │             │
│  └──────┬───────┘         └──────┬───────┘             │
└─────────┼─────────────────────────┼─────────────────────┘
          │                         │
          │   JWT Auth              │   JWT Auth
          ▼                         ▼
┌─────────────────────────────────────────────────────────┐
│        app.leger.run (Cloudflare Workers)                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  API Routes (Implemented):                      │   │
│  │  • POST /api/auth/validate                      │   │
│  │  • GET/POST/DELETE /api/secrets/:name           │   │
│  │  • GET/POST/PUT/DELETE /api/releases/:id        │   │
│  └─────────────────────────────────────────────────┘   │
│         │                  │                  │         │
│         ▼                  ▼                  ▼         │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐     │
│  │  KV      │      │  D1      │      │  R2      │     │
│  │ Secrets  │      │  Users   │      │(unused)  │     │
│  │  +Users  │      │ Releases │      │          │     │
│  └──────────┘      └──────────┘      └──────────┘     │
└─────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
1. CLI generates JWT (30-day expiry, HS256, shared secret)
   ↓
2. CLI opens browser: /auth?token={jwt}
   ↓
3. Browser: POST /api/auth/validate with JWT
   ↓
4. Backend validates JWT, creates/updates user
   ↓
5. Browser stores JWT + user in localStorage
   ↓
6. Redirect to /api-keys (default page)
   ↓
7. All subsequent requests include: Authorization: Bearer {jwt}
```

### Data Models (from Backend)

Reference `api/models/*.ts` for authoritative definitions:

```typescript
// User (from api/models/user.ts)
interface User {
  user_uuid: string;
  email: string;
  display_name: string | null;
  tailnet: string;
  created_at: string;
}

// Secret (from api/models/secret.ts)
interface SecretMetadata {
  name: string;
  created_at: string;
  updated_at: string;
  version: number;
}

interface SecretWithValue extends SecretMetadata {
  value: string; // Decrypted plaintext
}

// Release (from api/models/release.ts)
interface Release {
  id: string;
  user_uuid: string;
  name: string;
  git_url: string;
  git_branch: string;
  description: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}
```

---

## Architectural Decisions

### 1. JWT Storage & Session Management

**Decision:** 30-day JWT with no refresh tokens (v0.1.0 simplicity)

**Implementation Pattern:**
```typescript
// On successful auth
localStorage.setItem('jwt', token);
localStorage.setItem('user', JSON.stringify(userData));

// On 401 response
localStorage.removeItem('jwt');
localStorage.removeItem('user');
window.location.href = '/auth?token=expired';
```

### 2. API Error Handling

**Decision:** Centralized error handling with toast notifications

**Pattern:**
```typescript
class APIClient {
  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const response = await fetch(endpoint, options);
    const data = await response.json();
    
    if (!data.success) {
      // Handle 401 specially
      if (response.status === 401) {
        // Clear session and redirect
      }
      
      // Show toast for all errors
      toast.error(data.error.message, {
        description: data.error.action,
      });
      
      throw new Error(data.error.message);
    }
    
    return data.data;
  }
}
```

### 3. Loading States

**Decision:** Dual-layer loading (global + local)

**Implementation:**
- **Global:** Full-page spinner during route transitions (in AppLayout)
- **Local:** Per-component loading (buttons, forms, sections)

**Pattern:**
```typescript
// Local loading in save button
<Button disabled={isSaving}>
  {isSaving ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Saving...
    </>
  ) : 'Save Changes'}
</Button>
```

### 4. Form Validation

**Decision:** Real-time validation on field change

**Pattern:**
```typescript
const handleFieldChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  
  // Validate immediately
  const error = validateField(field, value);
  setErrors(prev => ({ ...prev, [field]: error }));
  setIsDirty(true);
};
```

### 5. Data Fetching

**Decision:** Simple `useState` + `useEffect` (no external libraries)

**Pattern:**
```typescript
function useSecrets() {
  const [data, setData] = useState<Secret[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const result = await apiClient.listSecrets();
        setData(result.secrets);
      } catch (error) {
        // Error already toasted
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, []);

  return { data, isLoading };
}
```

### 6. Navigation Structure

**CRITICAL:** Two-row header, NO account dropdown

```
Row 1 (Global Context):
[Logo] [flex-spacer] [GitHub Star] [Changelog] [Docs] [Theme Toggle] [Avatar]

Row 2 (Primary Navigation):
[API Keys] [Releases] [Models (disabled)] [Marketplace (disabled)] [Settings]
```

**Settings lives in Row 2, NOT in Avatar dropdown**

### 7. Release Form Complexity

**Decision:** v0.1.0 uses simple form (GitHub URL only)

Fields: `name`, `git_url`, `git_branch`, `description`

NO React JSON Schema Forms (RJSF) in this release. That's v0.2.0+.

---

## URL Structure & Routing

```typescript
const routes = {
  '/': 'Redirect to /api-keys',
  '/auth': 'JWT validation landing page',
  '/api-keys': 'Secret management (DEFAULT PAGE)',
  '/releases': 'List all releases',
  '/releases/new': 'Create release form',
  '/releases/:id': 'Edit release form',
  '/settings': 'Account settings',
};
```

**Protected Routes:** All except `/auth` require valid JWT

---

## File Structure to Implement

```
src/
├── lib/
│   └── api-client.ts          # Centralized API wrapper
│
├── types/
│   └── index.ts               # TypeScript interfaces
│
├── hooks/
│   ├── use-auth.ts            # Auth state & logout
│   ├── use-secrets.ts         # Secret CRUD operations
│   └── use-releases.ts        # Release CRUD operations
│
├── components/layout/
│   ├── AppLayout.tsx          # Two-row header + outlet
│   ├── PageLayout.tsx         # Max-width wrapper
│   └── PageHeader.tsx         # Title + description + actions
│
├── pages/
│   ├── AuthPage.tsx           # JWT validation (loading state)
│   ├── ApiKeysPage.tsx        # Secret management (DEFAULT)
│   ├── ReleasesPage.tsx       # Release grid/cards
│   ├── ReleaseFormPage.tsx    # Create/edit release
│   └── SettingsPage.tsx       # Account info (read-only)
│
└── App.tsx                    # Router + protected routes
```

---

## Implementation Guidance

### API Client Structure

**File:** `src/lib/api-client.ts`

**Requirements:**
- Export singleton instance: `export const apiClient = new APIClient()`
- Methods: `validateAuth()`, `listSecrets()`, `upsertSecret()`, `deleteSecret()`, `listReleases()`, `createRelease()`, `updateRelease()`, `deleteRelease()`
- Auto-inject JWT from localStorage in all requests
- Handle 401 by clearing session and redirecting to `/auth?token=expired`
- Show toast for all errors using sonner
- Return typed data (unwrap `data.data` from API response)

**Pattern:**
```typescript
class APIClient {
  private baseURL = '/api';
  
  private getHeaders(): HeadersInit {
    const jwt = localStorage.getItem('jwt');
    return {
      'Content-Type': 'application/json',
      ...(jwt && { Authorization: `Bearer ${jwt}` }),
    };
  }
  
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Fetch, parse response
    // If !data.success, handle error (toast + redirect on 401)
    // Return data.data
  }
  
  // Public methods
  async listSecrets(includeValues = false): Promise<{ secrets: Secret[] }> { }
  async upsertSecret(name: string, value: string): Promise<SecretMetadata> { }
  // ... etc
}
```

### Custom Hooks Structure

**File:** `src/hooks/use-auth.ts`

**Requirements:**
- Read initial state from localStorage
- Provide: `{ user, isAuthenticated, logout }`
- `logout()` clears localStorage and navigates to `/auth?token=expired`

**File:** `src/hooks/use-secrets.ts`

**Requirements:**
- Fetch secrets on mount
- Provide: `{ secrets, isLoading, upsertSecret, deleteSecret, refetch }`
- Show success toast on successful mutations
- Auto-refetch after mutations

**File:** `src/hooks/use-releases.ts`

**Requirements:**
- Fetch releases on mount
- Provide: `{ releases, isLoading, createRelease, updateRelease, deleteRelease, refetch }`
- Show success toast on successful mutations
- Auto-refetch after mutations

### Layout Components

**File:** `src/components/layout/AppLayout.tsx`

**Requirements:**
- Two-row header structure (see Navigation Structure above)
- Avatar dropdown contains ONLY: user info, Settings link, Logout
- Theme toggle in Row 1
- Navigation links in Row 2
- Outlet for child routes
- Import and use components from `src/components/ui/`

**File:** `src/components/layout/PageLayout.tsx`

Simple max-width wrapper:
```typescript
export function PageLayout({ children }: { children: React.ReactNode }) {
  return <div className="max-w-6xl mx-auto space-y-8">{children}</div>;
}
```

**File:** `src/components/layout/PageHeader.tsx`

```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-2">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
```

### Page Implementations

**File:** `src/pages/AuthPage.tsx`

**Requirements:**
- Extract `token` from URL query params
- Call `apiClient.validateAuth(token)` on mount
- On success: store JWT + user, navigate to `/api-keys`
- On failure: navigate to `/auth-error`
- Show loading spinner while validating

**File:** `src/pages/ApiKeysPage.tsx`

**Requirements:**
- Use `CategorySection` from `src/components/ui/form/layout/category-section`
- One section per provider (OpenAI, Anthropic, etc.)
- Each section has independent save button
- Use `SecretField` from `src/components/ui/form/fields/secret-field`
- Track dirty state per section
- Call `useSecrets().upsertSecret()` on save

**File:** `src/pages/ReleasesPage.tsx`

**Requirements:**
- Use `useReleases()` hook
- Display releases in grid of `Card` components
- Each card shows: name, version, git_url, git_branch, updated_at
- "Create Release" button navigates to `/releases/new`
- "Edit" button navigates to `/releases/:id`
- Empty state when no releases exist

**File:** `src/pages/ReleaseFormPage.tsx`

**Requirements:**
- Determine mode: `isNew = !useParams().id`
- If editing, fetch existing release and populate form
- Form fields: TextField (name), URLInput (git_url), TextField (git_branch), TextArea (description)
- Real-time validation on field change
- Use `CategorySection` with save button
- Show deploy command preview in Card below form
- On save: call `createRelease()` or `updateRelease()`, then navigate to `/releases`

**File:** `src/pages/SettingsPage.tsx`

**Requirements:**
- Read-only display of user info
- Use `CategorySection` for organization
- Show: email, tailnet, user_uuid (with copy button)
- No editing functionality in v0.1.0

### Router Configuration

**File:** `src/App.tsx` (rewrite completely)

**Requirements:**
- Use React Router v6
- Public route: `/auth`
- Protected routes (require JWT): all others
- Create `ProtectedRoute` wrapper component
- Default route `/` redirects to `/api-keys`
- Include `<Toaster />` from sonner

**Skeleton:**
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = !!localStorage.getItem('jwt');
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth?token=expired" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/api-keys" />} />
          {/* Add other routes */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Available UI Components

**Location:** `src/components/ui/`

You have access to a complete component library. Key components for this implementation:

### Form Components
- `TextField` - Text input with validation
- `SecretField` - Password input with show/hide toggle
- `URLInput` - URL input with optional prefix
- `TextArea` - Multi-line text input
- `SelectField` - Dropdown selection
- `ToggleField` - Boolean switch
- `ConditionalField` - Conditional rendering wrapper

### Form Layout
- `CategorySection` - Section with title, description, save button, dirty tracking
- `FieldGroup` - Consistent spacing for related fields
- `FormDescription` - Helper text

### UI Primitives
- `Button` (variants: default, outline, ghost, destructive, link)
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Badge` - Status indicators
- `Input` - Basic input (used internally by TextField)
- `Alert`, `AlertTitle`, `AlertDescription`

### Data Display
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
- `Avatar` - User profile images
- `Separator` - Visual dividers

### Navigation
- `DropdownMenu` - Context menus
- `Tabs` - Tabbed content

### Feedback
- `toast` from sonner - Success/error notifications
- `Dialog` - Modal dialogs
- `Tooltip` - Hover information

**Import pattern:**
```typescript
import { TextField } from '@/components/ui/form/fields/text-field';
import { CategorySection } from '@/components/ui/form/layout/category-section';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
```

## Implementation Scrutiny Checklist

Before considering the implementation complete, verify:

### Code Quality
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] All imports use `@/*` alias
- [ ] No hardcoded API URLs (use `/api` prefix)
- [ ] Proper error boundaries

### Architecture Compliance
- [ ] API client is singleton instance
- [ ] JWT stored in localStorage
- [ ] 401 responses trigger redirect to `/auth?token=expired`
- [ ] All errors show toast notifications
- [ ] Protected routes require authentication
- [ ] No account dropdown in Row 1
- [ ] Settings accessible from Row 2

### Component Usage
- [ ] All form fields use components from `src/components/ui/form/`
- [ ] CategorySection used for all major form sections
- [ ] FieldGroup used for field spacing
- [ ] SecretField used for API keys
- [ ] URLInput used for Git URLs
- [ ] Loading states use Loader2 icon from lucide-react

### Data Flow
- [ ] Hooks fetch data on mount
- [ ] Mutations trigger refetch
- [ ] Success toasts on successful mutations
- [ ] Error handling doesn't break UI
- [ ] Dirty state tracking works correctly

### UX Requirements
- [ ] Real-time validation on field change
- [ ] Loading spinners during async operations
- [ ] Empty states for lists
- [ ] Confirmation for destructive actions
- [ ] Copy buttons for IDs/commands
- [ ] Deploy command preview on release form

### Security
- [ ] JWT never logged to console
- [ ] Secrets masked by default
- [ ] No sensitive data in URL params
- [ ] CORS headers handled by backend

### Documentation
- [ ] Types exported from `src/types/`
- [ ] Complex logic has comments
- [ ] API client methods have TSDoc
- [ ] Component props have interfaces

---

## Common Pitfalls to Avoid

1. ❌ Don't create account dropdown in Row 1 → Settings is in Row 2
2. ❌ Don't use RJSF → Simple forms only for v0.1.0
3. ❌ Don't implement refresh tokens → 30-day JWT, re-auth on expiry
4. ❌ Don't forget JWT in API requests → Check localStorage
5. ❌ Don't skip validation → Real-time validation required
6. ❌ Don't use external data fetching libraries → useState + useEffect
7. ❌ Don't forget loading states → Both global and local needed
8. ❌ Don't skip toast notifications → Use for all user feedback
9. ❌ Don't hardcode URLs → Use `/api` prefix for all endpoints
10. ❌ Don't mutate state directly → Always use setState functions

---

## Success Criteria

**v0.1.0 is complete when:**

### Functional Requirements
1. ✅ User authenticates via CLI → Browser validates JWT
2. ✅ Web session established with JWT in localStorage
3. ✅ User can create/update/delete secrets via web UI
4. ✅ Secrets encrypted at rest in backend KV
5. ✅ CLI can sync secrets from backend
6. ✅ User can create/edit/delete releases (GitHub URLs)
7. ✅ Releases stored in backend D1
8. ✅ CLI can deploy using release metadata
9. ✅ All navigation works correctly
10. ✅ Settings page displays user information

### Quality Requirements
1. ✅ No TypeScript errors
2. ✅ No ESLint warnings (max 50 allowed)
3. ✅ All forms have real-time validation
4. ✅ All async operations show loading states
5. ✅ All errors display user-friendly toasts
6. ✅ All protected routes check authentication
7. ✅ 401 responses redirect to auth page
8. ✅ Empty states for all lists
9. ✅ Responsive layout works on mobile
10. ✅ Theme toggle persists across sessions

### Build Requirements
1. ✅ `npm run build` completes successfully
2. ✅ `npm run typecheck` passes
3. ✅ `npm run lint` passes (max 50 warnings)
4. ✅ Built assets load from `/dist`
5. ✅ Brand assets load from `/brand`

---

## Reference Documentation

**Backend API Specification:** `docs/v0.1.0-scope.md`  
**Backend Implementation:** `api/` directory  
**Component Catalogue:** `src/components/ui/` directory  
**Sitemap & Information Architecture:** `docs/sitemap-v2.md`  
**Remaining Work:** `docs/v0.1.0-remaining.md`

---

## Final Notes for Claude Code Agent

This is a **connection layer** implementation. You are connecting:
- **Existing backend API** → API client wrapper
- **Existing UI components** → Page implementations  
- **User interactions** → Data mutations

Focus on:
1. **Correctness** - Follow patterns exactly
2. **Completeness** - Implement all files listed
3. **Quality** - Pass all linters and type checks
4. **Testing** - Verify all flows work end-to-end

The backend is production-ready. The components are battle-tested. Your job is to wire them together cleanly and correctly.

**Scrutinize your implementation against the checklist before marking as complete.**

