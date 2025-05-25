# BookTrackr Web App Development Plan

*Last updated: 25 May 2025*

---

## 1. Vision & Core Principles

* **Modern, minimalist Goodreads**: friction‑free logging, beautiful browsing.
* **Healthy social layer**: no likes, follower counts, or engagement bait; focus on discovery & discussion.
* **Privacy‑first & non‑intrusive**: batched digests, no push notifications by default.
* **Fast everywhere**: edge‑rendered pages, server components, local caching.
* **Delightful stats**: playful but informative badges & analytics that encourage reading without gamifying attention.

## 2. Target Users & Personas

| Persona           | Goals                       | Pain Points                      | Key Features                        |
| ----------------- | --------------------------- | -------------------------------- | ----------------------------------- |
| "Avid Reader Amy" | Track books, share progress | Goodreads feels dated, cluttered | Quick logging, mobile‑friendly UI   |
| "Data Nerd Dan"   | Visualize reading stats     | Hard to export data              | Rich analytics, CSV export          |
| "Book Club Bea"   | Coordinate with friends     | Overwhelmed by notifications     | Group shelves & quiet daily digests |

## 3. Feature Roadmap

### 3.1 MVP (12 weeks)

1. **Auth & On‑boarding**

   * Email / social login via **Clerk**
   * Minimal profile (name, avatar, preferred genres)
2. **Personal Library**

   * Add/search books (Google Books & Open Library)
   * Shelves: *Read*, *Reading*, *Want to Read*
   * Star‑based rating (½‑star increments)
3. **Book Detail Page**

   * Cover, metadata, description (markdown collapsible)
   * Aggregate community rating (simple mean)
4. **Activity Feed**

   * Reverse‑chron log of friends’ shelf updates (no infinite scroll; "Load more" button)
   * Opt‑in daily/weekly email digest
5. **Stats Dashboard (v0)**

   * Total books/year, pages/year, average rating
   * Badge engine: First Book, 1k Pages, Genre Explorer, etc.
6. **Performance & Accessibility Baseline**

   * Lighthouse ≥ 90, a11y score ≥ 95

### 3.2 v1 (3–6 months)

* Review writing & rich comments (markdown + spoiler tags)
* Custom shelves & private notes
* Advanced stats: reading streaks, genre clouds, bookshelf heatmap
* Public profiles & shareable yearly wrap‑up page
* OpenAPI GraphQL endpoint for third‑party integrations

### 3.3 v2 (6–12 months)

* **Mobile apps**: React Native (Expo) using same React Query/GraphQL client
* Offline logging & sync
* Audiobook support (progress % instead of pages)
* OCR scanning of ISBNs (mobile)
* Collaborative group challenges & book club sessions

## 4. Tech Stack Overview

| Layer         | Choice                                      | Rationale                                               |
| ------------- | ------------------------------------------- | ------------------------------------------------------- |
| Runtime       | **Next.js 14** (App Router, Server Actions) | SSR + React Server Components, edge rendering on Vercel |
| Deployment    | **Vercel**                                  | Instant rollbacks, preview branches, analytics          |
| Auth          | **Clerk**                                   | Drop‑in UI, social providers, JWT for API routes        |
| DB            | **Neon PostgreSQL** + **Prisma ORM**        | Serverless branching, type‑safe access                  |
| Cache         | **Vercel KV** + **Prisma Query extensions** | 100 ms global edge reads                                |
| Book Data     | Google Books API, Open Library API          | Dual source fallback                                    |
| State         | **TanStack Query** + **Zustand** (light UI) | Cache/async management                                  |
| Styling       | **Tailwind CSS** + **shadcn/ui**            | Consistent minimal design                               |
| Charts        | **Recharts**                                | Lightweight, SSR‑friendly                               |
| Testing       | Vitest, React Testing Library, Playwright   | Unit to E2E                                             |
| CI/CD         | GitHub Actions → Vercel                     | Lint, tests, build, push preview                        |
| Observability | Sentry, Logtail, Vercel Analytics           | Error & perf tracing                                    |

## 5. System Architecture

```mermaid
flowchart LR
    subgraph Client
        A[Next.js App (RSC)]
    end
    subgraph Edge
        B[Vercel Edge Network] -->|KV Cache| C
    end
    subgraph Serverless
        C[Next.js Route Handlers] --> D[Prisma]
        C -->|Ext APIs| E((Google Books))
        C -->|Ext APIs| F((Open Library))
    end
    D --> G[Neon Postgres]
    A -- Clerk JWT --> C
```

*Page requests first consult the edge cache; miss flows to serverless function, which pulls from Neon and external APIs. External responses are normalized & cached.*

## 6. Data Model (ERD)

| Table            | Key Columns                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| **users**        | id (UUID), clerk\_id, name, avatar\_url, created\_at                                                                 |
| **books**        | id (UUID), google\_id, openlib\_id, title, author, published\_date, pages, cover\_url, description\_md, updated\_at  |
| **user\_books**  | id, user\_id, book\_id, shelf ENUM('READ','READING','WANT'), rating INT(0–10), started\_at, finished\_at, review\_md |
| **friends**      | id, requester\_id, addressee\_id, status ENUM('PENDING','ACCEPTED'), created\_at                                     |
| **badges**       | id, code, name, description, icon\_url                                                                               |
| **user\_badges** | id, user\_id, badge\_id, granted\_at                                                                                 |
| **stats\_cache** | user\_id PK, year INT, books INT, pages INT, avg\_rating NUMERIC, genres JSONB, updated\_at                          |

## 7. External Services & Integrations

* **Google Books** (primary) → 1k req/day free; use ISBN search first.
* **Open Library** (backup + covers).
* **Goodreads Import**: user uploads CSV; server job maps ISBNs to internal book IDs.
* Edge caching: 24 h TTL, staled‑while‑revalidate via Route Handler.

## 8. UX Guidelines & Component Library

* **Layout**: Centered fixed‑width (Letterboxd vibe) with responsive grid.
* **Themes**: Light & dark, system default.
* **Navigation**: Left rail: Library / Discover / Stats / Activity.
* **Typography**: Inter / Serif for headers (variable font weight).
* **Motion**: Framer Motion subtle fade/slide for page transitions.
* **Empty States**: Friendly illustrations (Open Source Scribbles).

## 9. Analytics & Badge Engine

* Nightly cron job aggregates `user_books` into `stats_cache`.
* Badge criteria JSON config executed in the same job.
* UI charts: pages per month (bar), genre breakdown (pie), reading streak (line).

## 10. Social Layer & Digest Notifications

* Friendship requires mutual accept → prevents spam.
* Activity feed API paginated & filterable (friends / all / mine).
* **Email digest** (SendGrid): single daily at 8 AM local summarizing friends’ updates.
* No push or in‑app badges; inbox list pattern for notifications.

## 11. Security & Privacy

* Clerk handles session JWT; server verifies signature via middleware.
* Row‑level security in Neon using `user_id` column & Postgres policies.
* DPA compliance: user can export or delete their data (GDPR‑like).

## 12. Accessibility & Performance Targets

* Semantic HTML, SR‑only labels on icons.
* prefers‑reduced‑motion respects OS setting.
* Largest Contentful Paint < 2.5 s on 3G.

## 13. DevOps & Deployment Pipeline

```yaml
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm test
      - run: pnpm prisma migrate deploy
      - run: pnpm build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT }}
```

* Separate preview DB branches on Neon per PR.
* Automatic migrations in preview; manual approval for prod promote.

## 14. Testing Strategy

| Layer         | Framework               | Goal                         |
| ------------- | ----------------------- | ---------------------------- |
| Unit          | Vitest                  | Functions, utils             |
| Integration   | Vitest + Prisma Test DB | API route handlers           |
| E2E           | Playwright              | Happy paths, mobile viewport |
| Accessibility | @axe‑playwright         | a11y smoke test per route    |

## 15. Monitoring & Observability

* **Sentry**: Next.js plugin for server + client errors.
* **Logtail**: structured logs from API routes.
* **Vercel Analytics**: core vitals, request durations.
* PagerDuty escalation only on 5xx error spike > 1 min.

## 16. Future Mobile Apps

* **React Native** (Expo Router) reusing UI primitives (shadcn + Tailwind React Native).
* Clerk React Native SDK.
* SQLite local cache synced with Neon via tRPC.

## 17. Milestones & Timeline (Draft)

| Week  | Deliverable                            |
| ----- | -------------------------------------- |
| 1     | Project scaffold, CI/CD, auth flow     |
| 2–3   | Book search + add to shelves           |
| 4     | Personal library views                 |
| 5     | Activity feed, friendship request flow |
| 6     | Stats engine v0, dashboard UI          |
| 7     | Badge engine, seed initial badges      |
| 8     | Accessibility & perf polish            |
| 9     | Public alpha (friends invite)          |
| 10–12 | Stabilize, marketing site, soft launch |

## 18. Risks & Mitigations

* **API rate limits** → multi‑provider fallback + nightly sync
* **Serverless cold starts** → edge functions + connection pooling (Prisma Data Proxy)
* **Social spam** → mutual friendship & daily digest only

## 19. Open Questions / Next Steps

1. Choose analytics provider for privacy‑safe telemetry (Plausible vs PostHog‑EU).
2. Decide on open‑source licensing for community edition.
3. Artwork & branding direction – hire illustrator? 

---

*End of document*
