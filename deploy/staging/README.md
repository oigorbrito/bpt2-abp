# Staging packaging

This directory packages the existing BPT2 runtime without changing its product architecture.

- `Dockerfile.api`: .NET 10 / ABP host.
- `Dockerfile.web`: Next.js standalone public web.
- PostgreSQL remains an external service.
- Runtime secrets and credentials are not baked into either image.

## Important database boundary

The domain modules still use the repository's disposable fresh-migration gate for CI. There is no durable, versioned production migration authority for those module schemas yet.

Therefore these images are suitable for:

- disposable/ephemeral staging;
- build/runtime packaging validation;
- a hosted acceptance environment whose database can be recreated.

They are **not** sufficient evidence for a persistent production database rollout.

## Required runtime configuration

API:

- `ConnectionStrings__Default`
- `App__SelfUrl`
- `App__CorsOrigins`
- `App__RedirectAllowedUrls`
- `AuthServer__Authority`
- `OpenIddict__Applications__BomPraTi_SellerWeb__RootUrl`
- `OpenIddict__Applications__BomPraTi_BuyerWeb__RootUrl`

Web:

- `BPT_API_BASE_URL` at runtime for server-side API calls;
- `BPT_PUBLIC_BASE_URL` is required at build time for production metadata and should also be present at runtime;
- `NEXT_PUBLIC_BPT_API_BASE_URL` and `NEXT_PUBLIC_BPT_AUTHORITY` are build-time public origins because Next.js embeds public variables into the browser bundle.

The hosted acceptance target must prove the browser-visible Next.js UI, the BPT2 API/PostgreSQL path, and the Podium7 catalog feed separately.
