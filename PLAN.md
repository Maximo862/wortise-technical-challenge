# Development Plan

## Phase 1 — Repository Setup

- Set up the monorepo using npm workspaces.
- Set up the `server` with Hono and TypeScript.
- Add a `GET /health` endpoint.
- Set up the `client` with Vite, React, and TypeScript.
- Add a root `.env.example` file without real credentials.
- Verify that `curl localhost:3000/health` returns a valid response.
- Verify that `localhost:5173` loads without console errors.

## Phase 2 — MongoDB

- Create `server/src/db/client.ts`.
- Connect to MongoDB using the native MongoDB driver.
- Reuse the MongoDB connection between requests.
- Log a successful database connection when the server starts.
- Verify that inserting and reading a test document works correctly.

## Phase 3 — Better Auth Backend Setup

- Configure a `betterAuth` instance using the MongoDB adapter.
- Mount the Better Auth handler under `/api/auth/*`.
- Add session handling middleware as needed.
- Configure CORS with an explicit origin and `credentials: true`.
- Verify that `POST /api/auth/sign-up/email` creates a user and returns the expected session cookie.
- Verify that the user is stored correctly in MongoDB.

## Phase 4 — Frontend Setup and Authentication

- Configure `HeroUIProvider`, `QueryClientProvider`, and `RouterProvider`.
- Configure the Better Auth client.
- Create the `/register` page using TanStack Form and Zod.
- Create the `/login` page using TanStack Form and Zod.
- Implement logout.
- Verify the full register → login → logout flow from the UI.
- Verify that the session persists after refreshing the page.

## Phase 5 — Private Route Protection

- Protect private routes using TanStack Router.
- Redirect unauthenticated users to `/login`.
- Verify that visiting `/articles` without a valid session redirects correctly.

## Phase 6 — Articles Backend

- Create Zod schemas for creating and updating articles.
- Implement `articles.repository.ts` using the MongoDB native driver.
- Implement `articles.service.ts` for business rules, ownership checks, and domain errors.
- Implement:
  - `POST /api/articles`
  - `GET /api/articles/mine`
  - `GET /api/articles/:id`
  - `PATCH /api/articles/:id`
  - `DELETE /api/articles/:id`
- Always obtain `authorId` from the authenticated session, never from the request body or query parameters.
- Enforce article ownership on the server when editing and deleting.
- Prefer filtering MongoDB operations using both `_id` and `authorId`.
- Implement real pagination using `skip` and `limit`.
- Verify that User A can create an article.
- Verify that User B cannot edit or delete User A's article.

## Phase 7 — Articles Frontend

- Define consistent query keys such as:
  - `["articles", "mine", { page }]`
  - `["articles", "detail", articleId]`
- Use `useQuery` for the paginated article list and article details.
- Use `useMutation` for creating, editing, and deleting articles.
- Invalidate the relevant queries after mutations.
- Create:
  - `/articles`
  - `/articles/new`
  - `/articles/$articleId`
  - `/articles/$articleId/edit`
- Handle loading, error, and empty states.
- Verify the complete create → view → edit → delete flow without manually refreshing the page.

## Phase 8 — Public Page

- Implement `GET /api/public/authors` to return authors and their article counts.
- Implement `GET /api/public/search` for server-side article search.
- Support search by:
  - article title
  - article content
  - author name
- Create the public `/` page with the authors list and article search.
- Invalidate the relevant public queries after article mutations.
- Verify that searching by title, content, and author name returns the expected results.
- Verify that article counts update correctly after creating or deleting an article.

## Phase 9 — Polish and Delivery

- Review the complete mandatory requirements checklist.
- Verify responsive behavior on desktop and mobile.
- Ensure form and API errors are understandable.
- Review loading, error, and empty states across the application.
- Complete the `README.md` with:
  - installation instructions
  - environment variables
  - local development instructions
  - architecture and relevant technical decisions
  - AI tools used and how they were used
- Review the final `.env.example`.
- Verify that no real credentials are committed.
- Test a clean installation using only the README instructions.

## Phase 10 — Optional Improvements

- Reflect search and filter state in the URL.
- Add seed data.
- Deploy the application.
- Improve accessibility.
- Improve the visual design.