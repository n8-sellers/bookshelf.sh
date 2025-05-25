# BookTrackr Tech Context

*Last updated: 25 May 2025*

---

## Technology Stack

### Frontend Framework
**Next.js 14 (App Router)**
- **Rationale**: Server-side rendering, React Server Components, built-in optimizations
- **Key Features**: App Router, Server Actions, edge rendering
- **Benefits**: Performance, SEO, developer experience

### Runtime & Deployment
**Vercel Platform**
- **Features**: Instant deployments, preview branches, edge functions
- **Benefits**: Zero-config deployment, automatic scaling, global CDN
- **Analytics**: Core Web Vitals tracking, request monitoring

### Database & ORM
**Neon PostgreSQL + Prisma ORM**
- **Neon**: Serverless PostgreSQL with branching for preview environments
- **Prisma**: Type-safe database access, migration management, query optimization
- **Benefits**: Serverless scaling, development workflow, type safety

### Authentication
**Clerk**
- **Features**: Drop-in UI components, social providers, JWT tokens
- **Integration**: Next.js middleware, API route protection
- **Benefits**: Rapid implementation, security best practices

### Caching Strategy
**Vercel KV (Redis)**
- **Use Cases**: API response caching, session storage, rate limiting
- **TTL Strategy**: 24h for book data, 1h for user data, 5min for activity feeds
- **Benefits**: Global edge caching, sub-100ms reads

## Development Environment

### Package Manager
**pnpm**
- **Benefits**: Faster installs, disk space efficiency, strict dependency resolution
- **Workspace Support**: Monorepo capabilities for future mobile apps

### Code Quality Tools
```json
{
  "typescript": "^5.3.0",
  "eslint": "^8.55.0",
  "prettier": "^3.1.0",
  "husky": "^8.0.3",
  "lint-staged": "^15.2.0"
}
```

**Configuration**:
- TypeScript strict mode enabled
- ESLint with Next.js and accessibility rules
- Prettier for consistent formatting
- Husky for pre-commit hooks
- lint-staged for staged file linting

### Testing Stack

| Layer | Framework | Purpose |
|-------|-----------|---------|
| Unit | **Vitest** | Functions, utilities, components |
| Integration | **Vitest + Prisma Test DB** | API routes, database operations |
| E2E | **Playwright** | User workflows, cross-browser |
| Accessibility | **@axe-core/playwright** | a11y compliance testing |
| Visual | **Chromatic** (future) | Component visual regression |

### Development Scripts
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "test": "vitest",
  "test:e2e": "playwright test",
  "db:migrate": "prisma migrate dev",
  "db:generate": "prisma generate",
  "db:studio": "prisma studio",
  "lint": "eslint . --ext .ts,.tsx",
  "format": "prettier --write .",
  "type-check": "tsc --noEmit"
}
```

## External Services & APIs

### Book Data Sources

#### Google Books API
- **Endpoint**: `https://www.googleapis.com/books/v1/volumes`
- **Rate Limit**: 1,000 requests/day (free tier)
- **Search Strategy**: ISBN → Title + Author → Fallback to Open Library
- **Caching**: 24h TTL for book metadata

```typescript
interface GoogleBooksAPI {
  items: Array<{
    id: string;
    volumeInfo: {
      title: string;
      authors?: string[];
      publishedDate?: string;
      pageCount?: number;
      imageLinks?: {
        thumbnail?: string;
        small?: string;
        medium?: string;
      };
      description?: string;
      industryIdentifiers?: Array<{
        type: 'ISBN_10' | 'ISBN_13';
        identifier: string;
      }>;
    };
  }>;
}
```

#### Open Library API
- **Endpoint**: `https://openlibrary.org/api/books`
- **Rate Limit**: No strict limit (reasonable use)
- **Use Cases**: Backup data source, additional cover images
- **Caching**: 24h TTL for book metadata

```typescript
interface OpenLibraryAPI {
  [isbn: string]: {
    title: string;
    authors: Array<{ name: string }>;
    publish_date?: string;
    number_of_pages?: number;
    cover?: {
      small?: string;
      medium?: string;
      large?: string;
    };
    identifiers?: {
      isbn_10?: string[];
      isbn_13?: string[];
    };
  };
}
```

### Monitoring & Observability

#### Sentry
- **Error Tracking**: Client and server-side error capture
- **Performance Monitoring**: Transaction tracing, Core Web Vitals
- **Configuration**: Next.js plugin with source maps

#### Logtail (Timber.io)
- **Structured Logging**: JSON logs from API routes and Server Actions
- **Query Capabilities**: Fast search and filtering
- **Retention**: 30 days for development, 90 days for production

#### Vercel Analytics
- **Core Web Vitals**: LCP, FID, CLS tracking
- **Real User Monitoring**: Performance metrics from actual users
- **Geographic Insights**: Performance by region

## Environment Configuration

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# External APIs
GOOGLE_BOOKS_API_KEY="..."

# Caching
KV_REST_API_URL="..."
KV_REST_API_TOKEN="..."

# Monitoring
SENTRY_DSN="..."
SENTRY_ORG="..."
SENTRY_PROJECT="..."
LOGTAIL_TOKEN="..."

# Application
NEXT_PUBLIC_APP_URL="https://booktrackr.app"
NODE_ENV="production"
```

### Branch-based Environments

| Environment | Branch | Database | Domain |
|-------------|--------|----------|---------|
| Production | `main` | Neon Main Branch | `booktrackr.app` |
| Staging | `staging` | Neon Staging Branch | `staging.booktrackr.app` |
| Preview | `feature/*` | Neon Preview Branch | `*.vercel.app` |
| Development | Local | Local PostgreSQL | `localhost:3000` |

## Performance Targets & Optimization

### Core Web Vitals
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Optimization Strategies

#### Code Splitting
- Automatic route-based splitting with App Router
- Dynamic imports for heavy components
- Lazy loading for non-critical features

#### Image Optimization
```typescript
// Optimized image component
import Image from 'next/image';

<Image
  src={book.coverUrl}
  alt={`Cover of ${book.title}`}
  width={300}
  height={450}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

#### Database Optimization
- Connection pooling with Prisma Data Proxy
- Query optimization with includes and selects
- Pagination for large datasets
- Background jobs for expensive operations

## Security Considerations

### Authentication & Authorization
- JWT token verification in middleware
- Row-level security with user ID scoping
- CSRF protection with Server Actions
- Rate limiting on API endpoints

### Data Protection
- Environment variable encryption
- Database connection over SSL
- No sensitive data in client bundles
- Secure cookie settings

### Content Security Policy
```typescript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' clerk.com;
      style-src 'self' 'unsafe-inline' fonts.googleapis.com;
      img-src 'self' data: blob: books.google.com covers.openlibrary.org;
      font-src 'self' fonts.gstatic.com;
      connect-src 'self' api.clerk.com;
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

## Build & Deployment Pipeline

### CI/CD Workflow
```yaml
name: CI/CD
on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test
      - run: pnpm test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT }}
```

### Database Migrations
- Automatic migration deployment to preview environments
- Manual approval required for production migrations
- Rollback strategy with database snapshots

## Development Workflow

### Local Setup
```bash
# Clone and install
git clone https://github.com/user/booktrackr.git
cd booktrackr
pnpm install

# Database setup
pnpm db:migrate
pnpm db:generate
pnpm db:studio

# Start development server
pnpm dev
```

### Feature Development
1. Create feature branch from `main`
2. Implement changes with tests
3. Create pull request with preview deployment
4. Code review and QA on preview environment
5. Merge to main for production deployment

### Testing Strategy
- Unit tests run on every commit
- Integration tests run in CI/CD
- E2E tests run on staging deployment
- Manual QA for major features

---

*This document captures the technical implementation details and development setup for BookTrackr.*
