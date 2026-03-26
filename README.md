This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## AI generation (Gemini / Veo)

Video and text generation go through **server** routes (`/api/gemini`, `/api/video/*`). The value in `GOOGLE_GENERATIVE_AI_API_KEY` is used for **every visitor**; there is no per-user key in the browser. Copy [.env.example](.env.example) to `.env.local` for local dev, and add the same variables to your hosting provider’s **environment** (e.g. Vercel → Settings → Environment Variables) for production so people other than you can generate. Do not use a `NEXT_PUBLIC_` prefix on the API key.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

### Environment variables (project → Settings → Environment Variables)

Add these for **Production** (and **Preview** if you want previews to generate / share data):

| Variable | Required | Purpose |
|----------|----------|---------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | **Yes** | Gemini + Veo from [Google AI Studio](https://aistudio.google.com/apikey). Same as local `.env.local` — server-only, never `NEXT_PUBLIC_`. |
| `UPSTASH_REDIS_REST_URL` | Recommended (required unless file fallback set) | Account data, posts, sessions, follows persist across serverless instances and cold starts. Without Redis, configure `NOMI_DB_FILE_PATH` to use mounted persistent disk. |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended (required unless file fallback set) | Paired with the URL above ([Upstash](https://upstash.com/) → create Redis → REST API). |
| `NOMI_DB_FILE_PATH` | Optional fallback | Absolute or relative JSON file path for persistent storage when Redis is unavailable (must point to persistent mounted storage in your host/container). |
| `NOMI_ALLOW_EPHEMERAL_DB` | Temporary/testing only | Set to `true` only if you intentionally want non-persistent in-memory mode in production. |

Optional (see [.env.example](.env.example)): `NOMI_DB_FILE_PATH`, `GEMINI_MODEL`, `VEO_MODEL`, `VEO_GENERATE_AUDIO`, `VEO_VIDEO_DURATION_SECONDS`, `VEO_VIDEO_RESOLUTION`, `VEO_VIDEO_COMPRESSION`.

After changing variables, trigger a **redeploy** (Deployments → ⋮ → Redeploy) so new values load.

From a machine where you’re logged into Vercel (`npx vercel login`) and the repo is linked (`npx vercel link` once), you can push values from `.env.local` to the linked project:

```bash
npm run vercel:env
```

(Add `UPSTASH_*`, `NOMI_DB_FILE_PATH`, and optionally `NOMI_ALLOW_EPHEMERAL_DB` to `.env.local` first; empty keys are skipped.)

If neither Redis nor `NOMI_DB_FILE_PATH` is configured in production, the server now fails fast with a clear error so account/session persistence is not accidentally deployed in ephemeral mode.

The easiest way to deploy is the [Vercel](https://vercel.com/new) import from GitHub flow. See [Next.js on Vercel](https://nextjs.org/docs/app/building-your-application/deploying) for more.
