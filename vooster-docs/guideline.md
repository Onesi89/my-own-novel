# Code Guideline Document

---

## 1. Project Overview

This project is a Jamstack-based web service that transforms Google Timeline location data into personalized AI-generated web novels. The architecture leverages Next.js 15 (React 19), TypeScript, Tailwind CSS, shadcn UI, zustand for state management, and tRPC for type-safe APIs. The backend utilizes Node.js 20, Supabase (PostgreSQL), Prisma ORM, and integrates with OpenAI/Anthropic AI APIs. The system is modularized using Feature-Sliced Design (FSD) principles and is optimized for scalability, maintainability, and rapid iteration. Deployment is managed via Vercel and Railway, with CI/CD through GitHub Actions.

---

## 2. Core Principles

1. **Type Safety First:** All code MUST be fully typed using TypeScript or zod schemas.
2. **Single Responsibility:** Each file, function, and module MUST have a single, clear purpose.
3. **Explicit Error Handling:** All asynchronous operations and external calls MUST handle errors explicitly.
4. **Feature Isolation:** Features MUST be separated using FSD, avoiding cross-feature dependencies.
5. **Security by Default:** Sensitive data handling and authentication MUST adhere to least privilege and encryption best practices.

---

## 3. Language-Specific Guidelines

### 3.1 TypeScript & Next.js (Frontend and API)

#### File Organization and Directory Structure

- MUST follow the FSD structure: `features/`, `entities/`, `widgets/`, `shared/`.
- Each feature/entity/widget MUST have its own folder with `model/`, `ui/`, `api/`, `lib/` subfolders as needed.
- Shared utilities, types, and constants MUST reside in `shared/`.

```typescript
// MUST: Feature-sliced structure for a story feature
apps/web/src/features/story/
  ├── model/
  ├── ui/
  ├── api/
  └── lib/
```

#### Import/Dependency Management

- MUST use absolute imports from `src/` root.
- MUST import only what is necessary per file.
- MUST NOT use deep relative imports (`../../../`).
- External dependencies MUST be declared in `package.json` and imported at the top.

```typescript
// MUST: Absolute import and minimal dependency
import { StoryCard } from 'features/story/ui/StoryCard';
```

```typescript
// MUST NOT: Deep relative import
import StoryCard from '../../../../features/story/ui/StoryCard';
// Use absolute import instead
```

#### Error Handling Patterns

- All async functions MUST use `try-catch` blocks.
- API errors MUST be mapped to user-friendly messages.
- Validation errors MUST leverage zod and be surfaced to the UI.

```typescript
// MUST: Explicit error handling with zod validation
import { z } from 'zod';

const schema = z.object({ name: z.string() });

async function fetchData(input: unknown) {
  try {
    const parsed = schema.parse(input);
    // proceed with parsed data
  } catch (error) {
    // handle validation error
    throw new Error('Invalid input');
  }
}
```

---

### 3.2 Node.js (API/Backend)

#### File Organization

- API routes MUST be organized by domain in `packages/api`.
- Shared adapters (AI, Google) MUST reside in dedicated packages.
- Background jobs MUST be under `apps/worker/src/jobs`.

#### Import/Dependency Management

- MUST use ES modules (`import` syntax).
- Internal modules MUST use absolute imports.
- Circular dependencies MUST be avoided.

#### Error Handling Patterns

- All external API/database calls MUST be wrapped in `try-catch`.
- Errors MUST be logged using `pino`.
- Sensitive error details MUST NOT be exposed to clients.

```typescript
// MUST: Error logging and safe error response
import { logger } from 'shared/lib/logger';

async function getStory(req, res) {
  try {
    const story = await db.story.findById(req.params.id);
    res.json(story);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
```

---

### 3.3 Prisma & Supabase (Database)

- Prisma schema changes MUST go through migrations.
- Models MUST use explicit types and relations.
- Sensitive fields (e.g., OAuth tokens) MUST be stored encrypted or hashed.

```prisma
// MUST: Explicit relations and types
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  stories   Story[]
}
```

---

### 3.4 Tailwind CSS & shadcn UI

- MUST use Tailwind utility classes for layout and spacing.
- MUST NOT use inline styles except for dynamic values.
- Shared UI components MUST reside in `shared/ui`.

---

## 4. Code Style Rules

### MUST Follow

1. **Consistent Naming:** Use camelCase for variables and functions, PascalCase for components and classes.  
   _Rationale: Improves readability and maintainability._

2. **Strict Typing:** All functions, props, and API contracts MUST have explicit TypeScript types.  
   _Rationale: Prevents runtime errors and improves developer experience._

3. **Functional Components:** All React components MUST be functional components.  
   _Rationale: Aligns with React 19 best practices and hooks._

4. **Atomic Commits:** Each commit MUST address a single concern or feature.  
   _Rationale: Facilitates code review and rollback._

5. **Tests for Business Logic:** All core business logic (model/services/api) MUST have unit tests using Vitest.  
   _Rationale: Ensures reliability and guards against regressions._

```typescript
// MUST: Strictly typed functional component
type StoryCardProps = { title: string; author: string };

export const StoryCard: React.FC<StoryCardProps> = ({ title, author }) => (
  <div className="p-4 bg-white rounded">{title} by {author}</div>
);
```

### MUST NOT Do

1. **No Multi-responsibility Files:** MUST NOT combine unrelated logic (e.g., UI, data fetching, state) in a single file.  
   _Rationale: Violates separation of concerns, difficult to test/maintain._

2. **No Implicit Any:** MUST NOT use implicit `any` types.  
   _Rationale: Undermines type safety._

3. **No Direct State Mutation:** MUST NOT mutate state directly in React/zustand.  
   _Rationale: Causes unpredictable UI behavior._

4. **No Hardcoded Strings:** MUST NOT hardcode user-facing strings; use i18n or constants.  
   _Rationale: Facilitates localization and consistency._

5. **No Logic in Render:** MUST NOT perform side effects or data fetching inside React render methods.  
   _Rationale: Leads to performance issues and bugs._

```typescript
// MUST NOT: Multi-responsibility file
// BAD: UI, state, and API logic in one file
export function StoryPage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/story').then(res => res.json()).then(setData);
  }, []);
  return <div>{data?.title}</div>;
}
// Split into separate files: UI, hook, and API logic
```

---

## 5. Architecture Patterns

### Component/Module Structure

- Each feature/entity/widget MUST be a self-contained module with its own model, UI, and API logic.
- Shared logic MUST be extracted to `shared/`.

```typescript
// MUST: Feature module structure
features/story/
  ├── model/useStory.ts
  ├── ui/StoryCard.tsx
  └── api/storyApi.ts
```

### Data Flow Patterns

- Frontend communicates with backend using tRPC procedures.
- All data fetching MUST be performed in hooks or service files, NOT in UI components.
- State updates MUST be performed via zustand stores or React hooks.

```typescript
// MUST: Data fetching in hook, not in component
import { useQuery } from '@tanstack/react-query';

export function useStory(id: string) {
  return useQuery(['story', id], () => storyApi.getStory(id));
}
```

### State Management Conventions

- Global state MUST be managed via zustand.
- Local UI state MUST use React hooks.
- State stores MUST be colocated with their feature.

```typescript
// MUST: zustand store colocated with feature
// features/story/model/storyStore.ts
import { create } from 'zustand';

export const useStoryStore = create(set => ({
  stories: [],
  setStories: (stories) => set({ stories }),
}));
```

### API Design Standards

- All APIs MUST be type-safe using tRPC and zod.
- Input/output schemas MUST be validated at the boundary.
- API errors MUST use consistent error objects.

```typescript
// MUST: tRPC procedure with zod validation
import { z } from 'zod';
import { publicProcedure } from 'packages/api/trpc';

export const getStory = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    // fetch and return story
  });
```

---

## Example Code Snippets

```typescript
// MUST: Single-responsibility functional component
export function TimelineSelector({ onSelect }: { onSelect: (range: Date[]) => void }) {
  // UI logic only
  return <Calendar onSelect={onSelect} />;
}
// Data fetching and state logic must be in separate hooks or model files.
```

```typescript
// MUST NOT: Direct state mutation
const store = useStoryStore.getState();
store.stories.push(newStory); // ❌ Do not mutate directly
// Instead, use the provided setter
useStoryStore.getState().setStories([...store.stories, newStory]);
```

```typescript
// MUST: Error handling in async API call
async function fetchTimeline(token: string) {
  try {
    const res = await fetch('/api/timeline', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to fetch timeline');
    return await res.json();
  } catch (error) {
    // Log and rethrow or handle gracefully
    logger.error(error);
    throw new Error('Unable to load timeline data');
  }
}
```

---

## Quality Criteria

- **Specificity:** All rules are enforceable and mapped to the project's tech stack.
- **Justification:** Each directive is explained with rationale.
- **Consistency:** All code MUST align with FSD and type safety principles.
- **Practicality:** Examples illustrate correct and incorrect patterns for immediate adoption.

---

**This document is the mandatory reference for all code contributions to this project. Adherence is required for code reviews, CI/CD, and production releases.**