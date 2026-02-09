# Vibe Client - Typed API for Vibe App

Prisma-style typed client for interacting with the Vibe App API.

## Quick Start

```typescript
import { vibe } from '@payez/next-mvp/vibe'

// Query users
const { data: users, meta } = await vibe.users.findMany({
  where: { type: 'human' },
  take: 10,
  orderBy: { created_at: 'desc' }
})

// Get single record
const user = await vibe.users.findUnique({ where: { id: 123 } })

// Create
const newUser = await vibe.users.create({
  data: { email: 'test@example.com', name: 'Test User', type: 'human' }
})

// Update
const updated = await vibe.users.update({
  where: { id: 123 },
  data: { name: 'Updated Name' }
})

// Delete (soft delete)
await vibe.users.delete({ where: { id: 123 } })
```

---

## Configuration

### Environment Variables

```env
VIBE_API_URL=https://api.vibe.example.com
VIBE_CLIENT_ID=vibe_d5462b0bbd634a84
VIBE_CLIENT_SECRET=your_secret_here
```

### Custom Client

```typescript
import { createVibeClient } from '@payez/next-mvp/vibe'

const customVibe = createVibeClient({
  baseUrl: 'https://custom-api.example.com',
  clientId: 'vibe_custom123',
  clientSecret: 'secret',
})

const users = await customVibe.users.findMany()
```

---

## Available Tables

| Table | Delegate | Description |
|-------|----------|-------------|
| `users` | `vibe.users` | User accounts |
| `login_sessions` | `vibe.login_sessions` | Session tracking |
| `profiles` | `vibe.profiles` | User profiles |
| `settings` | `vibe.settings` | App settings |
| `files` | `vibe.files` | File metadata |
| `notifications` | `vibe.notifications` | User notifications |
| `activity_log` | `vibe.activity_log` | Audit trail |
| `tags` | `vibe.tags` | Tag system |
| `comments` | `vibe.comments` | Comments |
| `site_logs` | `vibe.site_logs` | Application logs |

---

## Query Methods

### findMany

Fetch multiple records with filtering, pagination, and sorting.

```typescript
const result = await vibe.users.findMany({
  where: {
    type: 'human',
    email: { like: '%@example.com' }
  },
  take: 10,      // limit
  skip: 0,       // offset
  orderBy: { created_at: 'desc' }
})

// result.data: IVibeUser[]
// result.meta: { total: number, limit: number, offset: number }
```

### Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| (none) | Equals | `{ status: 'active' }` |
| `eq` | Equals | `{ status: { eq: 'active' } }` |
| `neq` | Not equals | `{ status: { neq: 'deleted' } }` |
| `gt` | Greater than | `{ login_count: { gt: 5 } }` |
| `gte` | Greater or equal | `{ login_count: { gte: 5 } }` |
| `lt` | Less than | `{ login_count: { lt: 100 } }` |
| `lte` | Less or equal | `{ login_count: { lte: 100 } }` |
| `like` | Pattern match | `{ email: { like: '%@gmail.com' } }` |
| `in` | In array | `{ type: { in: ['human', 'admin'] } }` |
| `nin` | Not in array | `{ type: { nin: ['service'] } }` |

### findUnique

Fetch a single record by ID. Throws `VibeNotFoundError` if not found.

```typescript
const user = await vibe.users.findUnique({ where: { id: 123 } })
```

### findUniqueOrNull

Same as `findUnique` but returns `null` instead of throwing.

```typescript
const user = await vibe.users.findUniqueOrNull({ where: { id: 123 } })
if (user) {
  console.log(user.email)
}
```

### findFirst

Find the first record matching the filter.

```typescript
const admin = await vibe.users.findFirst({
  where: { type: 'admin' },
  orderBy: { created_at: 'asc' }
})
```

### count

Count records matching a filter.

```typescript
const activeCount = await vibe.users.count({
  where: { type: 'human' }
})
```

---

## Mutation Methods

### create

Create a new record.

```typescript
const user = await vibe.users.create({
  data: {
    email: 'new@example.com',
    name: 'New User',
    type: 'human',
    idp_user_id: 12345,
    login_count: 0
  }
})
```

### update

Update an existing record by ID.

```typescript
const updated = await vibe.users.update({
  where: { id: 123 },
  data: { name: 'Updated Name' }
})
```

### delete

Delete a record by ID (soft delete).

```typescript
const deleted = await vibe.users.delete({ where: { id: 123 } })
```

### createMany

Batch create multiple records.

```typescript
const result = await vibe.users.createMany({
  data: [
    { email: 'user1@example.com', name: 'User 1', type: 'human', idp_user_id: 1, login_count: 0 },
    { email: 'user2@example.com', name: 'User 2', type: 'human', idp_user_id: 2, login_count: 0 },
  ]
})
// result.count: 2
```

---

## React Query Hooks

For React applications, use the React Query wrappers for automatic caching and refetching.

```typescript
import {
  useVibeQuery,
  useVibeDetail,
  useVibeCount,
  useVibeMutation,
  useVibeCreate,
  useVibeUpdate,
  useVibeDelete
} from '@payez/next-mvp/vibe/hooks'
```

### useVibeQuery

Fetch multiple records with React Query caching.

```typescript
function UserList() {
  const { data, isLoading, error } = useVibeQuery('users', {
    where: { type: 'human' },
    take: 10,
    orderBy: { created_at: 'desc' }
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {data?.data.map(user => (
        <li key={user.id}>{user.email}</li>
      ))}
    </ul>
  )
}
```

### useVibeDetail

Fetch a single record by ID.

```typescript
function UserProfile({ userId }: { userId: number }) {
  const { data: user, isLoading } = useVibeDetail('users', userId)

  if (isLoading) return <div>Loading...</div>
  if (!user) return <div>User not found</div>

  return <div>{user.name}</div>
}
```

### useVibeCount

Get record count.

```typescript
function UserStats() {
  const { data: count } = useVibeCount('users', {
    where: { type: 'admin' }
  })

  return <div>Admin users: {count}</div>
}
```

### useVibeMutation / useVibeCreate / useVibeUpdate / useVibeDelete

Mutations with automatic cache invalidation.

```typescript
function CreateUserForm() {
  const createUser = useVibeCreate('users')
  // or: useVibeMutation('users', 'create')

  const handleSubmit = async (formData: FormData) => {
    await createUser.mutateAsync({
      email: formData.get('email') as string,
      name: formData.get('name') as string,
      type: 'human',
      idp_user_id: 0,
      login_count: 0
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={createUser.isPending}>
        {createUser.isPending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  )
}
```

### Prefetching for SSR

```typescript
import { QueryClient } from '@tanstack/react-query'
import { prefetchVibeQuery, prefetchVibeDetail } from '@payez/next-mvp/vibe/hooks'

export async function getServerSideProps() {
  const queryClient = new QueryClient()

  await prefetchVibeQuery(queryClient, 'users', { take: 10 })
  await prefetchVibeDetail(queryClient, 'users', 123)

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  }
}
```

---

## Error Handling

All errors extend `VibeError` with typed error classes:

```typescript
import {
  VibeError,
  VibeNotFoundError,
  VibeValidationError,
  VibeAuthError,
  VibeRateLimitError,
  VibeConflictError,
  VibeServiceError
} from '@payez/next-mvp/vibe'

try {
  const user = await vibe.users.findUnique({ where: { id: 999 } })
} catch (error) {
  if (error instanceof VibeNotFoundError) {
    console.log('User not found')
  } else if (error instanceof VibeAuthError) {
    console.log('Authentication failed')
  } else if (error instanceof VibeRateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}s`)
  } else if (error instanceof VibeError) {
    console.log(`Vibe error: ${error.code} - ${error.message}`)
  }
}
```

### Error Classes

| Class | HTTP Status | Description |
|-------|-------------|-------------|
| `VibeNotFoundError` | 404 | Record not found |
| `VibeValidationError` | 400 | Invalid input data |
| `VibeAuthError` | 401/403 | Authentication/authorization failed |
| `VibeRateLimitError` | 429 | Too many requests |
| `VibeConflictError` | 409 | Duplicate/conflict |
| `VibeServiceError` | 500+ | Server error |

---

## Type Definitions

### Interfaces

All table types have interface definitions:

```typescript
import type {
  IVibeUser,
  IVibeLoginSession,
  IVibeProfile,
  IVibeSetting,
  IVibeFile,
  IVibeNotification,
  IVibeActivityLog,
  IVibeTag,
  IVibeComment,
  IVibeSiteLog
} from '@payez/next-mvp/vibe'
```

### Serializable Classes

For serialization/deserialization, use the class versions:

```typescript
import { VibeUser } from '@payez/next-mvp/vibe'

// From API response
const user = VibeUser.fromJSON(apiResponse)

// To JSON
const json = user.toJSON()

// Helper getters
console.log(user.displayName) // name or email
```

### Generic Types

```typescript
import type {
  VibeTableName,      // 'users' | 'login_sessions' | ...
  VibeTableType,      // Get type for a table: VibeTableType<'users'> = IVibeUser
  FindManyOptions,
  FindManyResult,
  WhereClause,
  OrderByClause
} from '@payez/next-mvp/vibe'
```

---

## Module Exports

| Import Path | Contents |
|-------------|----------|
| `@payez/next-mvp/vibe` | Everything (client, types, errors, classes) |
| `@payez/next-mvp/vibe/hooks` | React Query hooks |
| `@payez/next-mvp/vibe/client` | Client only (`vibe`, `createVibeClient`) |
| `@payez/next-mvp/vibe/types` | Type interfaces and classes |
| `@payez/next-mvp/vibe/errors` | Error classes |

---

## API Authentication

The client authenticates using headers:

```
X-Vibe-Client-Id: vibe_d5462b0bbd634a84
X-Vibe-Client-Secret: your_secret_here
```

Client IDs are UUID-based strings prefixed with `vibe_`.
