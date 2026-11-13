# Career Navigator API Worker

Optional, separately deployable Cloudflare Worker boundary for future real AI analysis. The static Astro site remains functional without it.

## Endpoints

- `GET /health` reports whether the provider variables are configured.
- `POST /v1/analyze`
- `POST /v1/replan`

Requests require explicit `consentToSendPrivateData: true`, are size-limited, rate-limited, timeout-bound, and treated as untrusted document content. Full request bodies are not logged. The provider key is read only from Worker secrets.

Without `AI_API_BASE_URL`, `AI_API_KEY`, and `AI_MODEL`, analysis returns `503` with `mode: "unavailable"`; the frontend must retain deterministic local analysis and must not claim that AI ran.

## Local setup

```bash
pnpm install
pnpm dev
```

Configure secrets only in the Cloudflare environment, never in the repository or public Astro bundle. Deployment requires explicit approval and Cloudflare credentials; this repository does not deploy the Worker automatically.
