# Grandma's Card Box

A full-stack recipe-sharing app: a React frontend and a serverless Node/Express API, built and deployed as two independently versioned services.

This project is intentionally built to demonstrate practical full-stack engineering in a portfolio context: a typed REST API with real authentication and authorization, direct-to-S3 file uploads, serverless deployment on AWS Lambda, and a production React frontend on Vercel.

## Project Goals

- Let people browse, search, and favorite recipes, and contribute their own with photos.
- Gate write actions (upload, edit, delete, favorite) behind a real account system with email verification, not just a login form.
- Keep the API cheap to run and easy to redeploy by targeting AWS Lambda instead of a always-on server, while still supporting a normal long-running Docker deployment.
- Give the API self-documenting, testable docs instead of a stale wiki page.

## Repositories

This is two independently deployed services, each with its own repo:

- [`grandmas-card-box-api`](grandmas-card-box-api) — Express/TypeScript REST API, deployed to AWS Lambda.
- [`grandmas-card-box-ui`](grandmas-card-box-ui) — React/Vite frontend, deployed to Vercel.

## Tech Stack

**API**

- Framework: Express + TypeScript
- Database: MongoDB (native driver, typed collection accessors)
- Auth: JWT (bearer tokens) + bcrypt password hashing
- File Storage: AWS S3 via presigned POST/GET URLs
- Email: Resend API (verification, password reset, feedback)
- API Docs: OpenAPI 3 spec served through Swagger UI
- Deployment: AWS Lambda (via `serverless-http`) behind API Gateway (HTTP API), or a standalone Docker container

**Frontend**

- Framework: React 19 + Vite
- Language: TypeScript
- UI: Tailwind CSS 4, lucide-react icons
- Observability: Vercel Analytics + Vercel Speed Insights, with custom event tracking (e.g. `login_modal_open` reasons)
- Deployment: Vercel (SPA rewrite config for client-side routing)

## Architecture Highlights

### Authentication & Accounts

- Signup/login issue a 7-day JWT; `requireAuth` validates it, `loadCurrentUser` resolves it to a full user document, `requireVerifiedEmail` gates actions that need a confirmed address.
- Email verification and password reset both reuse one generic single-use token flow (`issueToken`) — SHA-256-hashed at rest, TTL-expired via a MongoDB TTL index, and invalidated in bulk when a new one is issued.
- Password reset responses are intentionally identical whether or not the email exists, so the endpoint can't be used to enumerate accounts.
- Auth-adjacent endpoints (login, signup, forgot-password, feedback) sit behind a per-IP-per-route sliding-window rate limiter to blunt brute-force and email-bombing attempts.
- Account deletion cascades: owned recipes, favorites referencing those recipes, the user's own favorites, and outstanding verification tokens are all cleaned up before the user document is removed.

### Recipe API

- Full CRUD with server-side validation on every field (length caps, array size caps, enum checks) — no recipe reaches MongoDB unvalidated.
- Search combines a MongoDB text index (`title`), an aggregation-style ingredient-count filter, and a max-total-time filter, all optional and composable in one query string.
- Only the original uploader can edit or delete a recipe; requests are checked against `createdBy`, not just "logged in."
- Responses are shaped per-viewer: an authenticated request gets `isFavorited`/`isOwnRecipe` flags computed against that user, so the same list endpoint serves both anonymous and logged-in traffic without duplicating routes.
- `toPublicRecipe` centralizes stripping internal fields (`_id`, `createdBy`, `updatedAt`) from every response, so no route can accidentally leak them.

### Photo Uploads

- Uploads never pass through the API: the client requests a presigned S3 POST policy, uploads the image straight to S3, then saves the resulting public URL on the recipe.
- The presigned policy itself enforces content type and an 8MB size cap — constraints a plain presigned PUT URL can't express — so the API doesn't need to touch (or pay to proxy) image bytes.
- The bucket stays private; photos are served through short-lived presigned GET URLs rather than public bucket access.
- Replacing or deleting a recipe's photo cleans up the old S3 object only after the new database write succeeds, avoiding orphaned state on partial failure.

### API Documentation

- A full OpenAPI 3 spec (auth flows, recipe schema, favorites) is served at `/api-docs` via Swagger UI.
- The spec's `servers` entry is computed per-request from the incoming host, so "Try it out" works correctly in local dev, staging, and production without a hardcoded URL.

### Frontend

- Client-side routing (recipe detail pages, `/my-box`, `/upload`, `/verify-email`, `/reset-password`) implemented directly on the History API, including scroll-position restoration and distinguishing "arrived via shared link" from "opened in-app" for back-button behavior.
- Recipes get real, shareable URLs (`/recipes/:id`) rather than living only in component state.
- Gated tabs (My Box, Upload) redirect unauthenticated or unverified visitors to the login modal and record *why* they were prompted, via a tagged `login_modal_open` analytics event.
- Light/dark theme is persisted to `localStorage` and applied at the document level, not just per-component.

### Security Model

- Passwords are bcrypt-hashed (cost factor 10); reset/verification tokens are random 32-byte values, stored only as SHA-256 hashes.
- The API refuses to start in production without an explicit `JWT_SECRET`, rather than silently falling back to a guessable default.
- CORS is locked to an explicit, comma-separated allowlist of frontend origins in production.
- A honeypot field on the feedback form silently accepts (but discards) bot submissions instead of giving attackers a signal to route around it.

### Deployment

- The API builds to two independent targets from the same TypeScript source: `Dockerfile` for a long-running container (`server.ts`) and `Dockerfile.lambda` for AWS Lambda (`lambda.ts`, wrapped with `serverless-http`), with Lambda's Mongo connection cached across warm invocations.
- In production, Lambda sits behind API Gateway (HTTP API), which handles routing, TLS, and the public `execute-api.amazonaws.com` endpoint the frontend calls.
- A helper script (`scripts/build-and-push.sh`) builds the Lambda image, tags it with both the short git SHA and `latest`, and pushes to ECR.
- The frontend deploys to Vercel with a catch-all rewrite to `index.html` so client-side routes resolve correctly on a full page load/refresh.

## Local Development

**API**

```bash
cd grandmas-card-box-api
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, etc.
npm run dev
```

**Frontend**

```bash
cd grandmas-card-box-ui
npm install
npm run dev              # targets the deployed production API
npm run dev:local-api     # targets a locally running API instead
```

## Environment Variables (API)

- `MONGO_URI`, `MONGO_DB_NAME` — database connection
- `JWT_SECRET` — required in production
- `FRONTEND_URL` — comma-separated allowed CORS origins; also used to build verification/reset links
- `RESEND_API_KEY`, `EMAIL_FROM`, `FEEDBACK_TO_EMAIL` — transactional email (falls back to console logging when unset)
- `SEED_SECRET` — guards the `/admin/seed` endpoint
- `AWS_REGION`, `S3_BUCKET_NAME` — photo storage

## NPM Scripts

**API**

- `npm run dev` — local dev server with hot reload
- `npm run build` / `npm run start` — production build and run
- `npm run seed` — build then load seed recipes into the database
- `npm run docker:push` — build and push the Lambda image to ECR

**Frontend**

- `npm run dev` / `npm run dev:local-api` — local dev, against prod or local API
- `npm run build` / `npm run preview` — production build and local preview

## Why This Project Is Portfolio-Relevant

- Demonstrates a complete, real authentication system (JWT, bcrypt, verified email, password reset, rate limiting) rather than a stubbed login.
- Shows deliberate architectural trade-offs: direct-to-S3 uploads to avoid proxying file bytes through a serverless function, per-viewer response shaping instead of duplicated endpoints, and a shared token-issuing helper instead of parallel verification/reset implementations.
- Covers the full deployment story for a serverless API: dual Docker targets from one codebase, warm-invocation connection reuse, and a scripted image build/push pipeline.
- Self-documenting API via a dynamically-hosted OpenAPI spec, not a README that drifts out of sync with the actual endpoints.
