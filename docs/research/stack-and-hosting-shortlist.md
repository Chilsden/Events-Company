# Stack and Hosting Shortlist (backlog A-08, ledger T-032)

**Draft shortlist, no decision.** This note does not select a stack, framework, database or host. The founder decides later through A-01 (and A-09 for production hosting of real guest data). Nothing here authorises spend, account creation or real guest data.

- **Author role:** Solution Architect (single Claude Code session; not independently reviewed).
- **Date:** 2026-10-30. All sources accessed on this date.
- **Inputs read:** `CLAUDE.md`, decisions 0006 and 0019, [architecture](../architecture/MVP-TECHNICAL-ARCHITECTURE.md) (draft 0.3), [backlog](../planning/MVP-DELIVERY-BACKLOG.md) (A-01, A-08, A-09), [risks and spikes](../planning/MVP-TECHNICAL-RISKS-AND-SPIKES.md) (S-01 to S-13).

## 0. How this note keeps evidence apart (CLAUDE.md section 7)

Each layer uses the same labels:

- **Verified fact:** read at a primary source on 2026-10-30; URL in section 12.
- **Vendor claim / unverified:** from a vendor page or from general knowledge, not checked at the primary source, or the fetch tool could not show it. Treat as a hypothesis.
- **Trade-off (judgement):** the author's reasoning. Not measured.
- **Hypothesis to validate:** goes to a spike.
- **Recommendation:** none is a decision. Where one is given, it is "what the spikes should test first", not a choice.

No prices are stated except those quoted from a primary page in section 12. Everything else about cost is unverified and belongs to S-11. Provider names below are candidates, not endorsements.

## 1. Requirements the options are tested against

From the architecture and spec (not re-derived here):

1. One modular monolith ([0006](../decisions/0006-modular-monolith-direction.md)), small team (effectively one founder plus agents). Operations burden matters.
2. Relational database with transactions and, ideally, row-level security (architecture 2, 5, 14, 25).
3. S3-compatible object storage with short-lived signed URLs and direct browser upload (architecture 8).
4. Background worker for media, email, exports and retention jobs.
5. Realtime for displays and control (architecture 7), reconnect reloads state.
6. Offline-capable PWA behaviour, idempotent sync (architecture 9, [0017](../decisions/0017-minimum-offline-capability-per-product.md)).
7. UK-first. UK data location for real guest data is a legal question (A-09), but the development choice should not rule UK hosting out.
8. Privacy-heavy: erasure by design, revocation reaching caches and exports, support access audited.
9. Accessibility baseline in CI (A-07), internationalisation-ready (architecture 11).
10. Development uses synthetic data only (decisions 0018, 0019). Production deployment, `main` merges and real data stay gated.

## 2. Architecture section 2 assumptions this shortlist must confirm or revise

These are the assumptions stated or implied in architecture section 2 (and the sections it points to). A-01 confirms or revises each.

| # | Assumption | Source in architecture | Tested by |
|---|---|---|---|
| AS-1 | One deployable application (modular monolith), not microservices or serverless-only | 2, 0006 | Layer 2 below; S-11 |
| AS-2 | A browser front end that is responsive and a PWA where practical | 2 | S-01, S-05 |
| AS-3 | A background worker for slow jobs (media, email, exports, retention) | 2, 3 | S-04, S-13 |
| AS-4 | A relational database, relied on for transactional behaviour (draw commands, revocation plus ledger in one transaction, idempotency keys, unique constraints) | 2, 5, 14.4, 24.4 | S-06, S-02 |
| AS-5 | S3-compatible object storage | 2, 8 | S-04, S-13 |
| AS-6 | Tenant scoping in one data-access layer, backed by row-level security if the database supports it | 5 | Layer 3 below |
| AS-7 | Direct-to-storage uploads with short-lived signed URLs issued after a server permission check; chunked or resumable | 8 | S-04, S-13 |
| AS-8 | Private media by default; revocation reaches links, caches, exports (derivative keys versioned) | 8, 24.3 | S-13 |
| AS-9 | The simplest realtime mechanism that meets display and control needs, behind an internal interface; display state is reloaded, not replayed | 7 | S-03 |
| AS-10 | Browser-side local queue with idempotent batch sync; offline packs are expiring leases that are wiped | 9, 0017 | S-01, S-02 |
| AS-11 | Authentication behind an identity interface so the method can change; scoped, revocable device sessions | 6 | Layer 7 below |
| AS-12 | Lucky Draw execution is server-side and needs a connection | 9, 14 | S-06 |
| AS-13 | Separate development, staging and production environments; secrets in a manager; repeatable deployment | 20 | Layers 8, 9 |
| AS-14 | Accessibility check in CI that fails on serious violations | 26 | Layer 9 |
| AS-15 | Message catalogues for all UI text; locale-aware formatting | 11 | S-09 |
| AS-16 | Scale up the monolith and workers first; costs of storage, processing and egress are unmeasured | 22 | S-11 |
| AS-17 | Pseudonymous references for append-only records; backups not edited, erasure ledger re-applied on restore | 25, 24.3 | S-13, S-10 |
| AS-18 | Module boundaries are enforced by an automated check (lint or test), not by convention (added after review; see R-09) | module-boundary risk note | A-01 stack decision; no spike |
| AS-19 | Security-relevant actions are written to an audit log that survives restore (added after review) | AuditLog entity, 25 | S-13 |

## 3. Layer 1: language and runtime

**Question for A-01:** which language lets one builder (assisted by agents) ship a typed, testable monolith with a good ecosystem for PWA, realtime, image processing and accessibility testing?

| Option | For (trade-off, judgement) | Against (trade-off, judgement) |
|---|---|---|
| TypeScript on Node.js | One language across browser, server, worker and PWA service worker; strong typing; large ecosystem for realtime, S3 SDKs, image libraries; matches most accessibility and e2e test tooling | Heavier dependency tree and supply-chain surface; module-boundary discipline needs lint rules (R-09); CPU-heavy media work usually delegates to native libraries |
| Python (for example with Django) | Mature batteries-included server, admin, ORM and migrations; strong for image/ML work (moderation, translation experiments) | Separate language from the browser code; realtime and async story needs more care; two toolchains to maintain |
| Ruby (Rails) | Fast conventional CRUD productivity; built-in jobs, mailers, realtime channels | Smaller pool of examples for PWA and offline sync; separate language from the browser code |
| Go or C# (.NET) | Strong performance and concurrency for realtime; single binary deploys (Go) | Smaller ecosystem fit for rapid product UI iteration; more code for the same CRUD surface; agents and founder familiarity is a hypothesis to check |

- **Verified fact:** the Node.js release page lists v26, v24 ("Krypton") and v22 ("Jod") as LTS lines, and says production applications should only use Active LTS or Maintenance LTS releases. The page does not label Active versus Maintenance, so end-of-life dates need checking at the Node.js release schedule before a version is pinned. Source: S1.
- **Hypothesis:** the founder's and agents' existing familiarity is unknown to the author. If the founder has a strong preference, that outweighs most of the table.
- **Note:** `CLAUDE.md` says do not assume a framework or provider until a decision record exists. This table is options only.

## 4. Layer 2: web framework (server plus front end)

**Question:** can one framework (or one server plus one front-end library) deliver server-rendered public pages, an app shell that works as a PWA, and a worker process, while keeping module boundaries enforceable?

| Option | For | Against |
|---|---|---|
| Full-stack React meta-framework (for example Next.js, Remix/React Router) | Large component ecosystem and accessibility libraries; server and client in one repo; one language if TypeScript | Hosting coupling varies by framework; server-only features may assume a particular platform; long-lived processes (workers, WebSockets) are awkward on serverless hosts; framework churn |
| SvelteKit (or similar compact framework) | Small client bundles (helpful for display machines and guest phones); simple mental model; adapter choice for Node hosting | Smaller ecosystem, fewer ready-made accessible components; fewer people and examples |
| Server-first framework with light browser layer (Django, Rails or Laravel plus htmx/Alpine and a small JS bundle for the PWA) | Fast to build forms, admin and permissions; module and ORM conventions help the "single data-access layer" rule | Display, mosaic rendering and offline queue still need a substantial JS front end; two codebases of UI conventions |
| Separate API (for example Fastify/Hono/NestJS in TypeScript) plus a SPA front end | Clean split between server rules and browser; easy to run a worker beside the API | More plumbing; two deployables unless carefully kept in one repo; duplicates routing and validation unless schemas are shared |

- **Vendor claim / unverified:** each framework's current major version, long-term support position and adapter coverage were not checked in this pass. Check at the primary documentation in the spike, not from this table.
- **Trade-off:** the monolith decision (0006) argues for one deployable. A framework that assumes serverless functions can still be run as a long-lived Node process, but that must be tested (S-03, S-04).
- **Hypothesis:** the shared rendering library (D-12) and the keyboard shortcut service (architecture 12) are framework-independent browser code. Test this by building them outside any framework first in S-05.

## 5. Layer 3: database and tenancy approach

**Question:** which relational database gives transactions, unique constraints, row-level security and UK/EU hosting without much operations work?

| Option | For | Against |
|---|---|---|
| PostgreSQL, managed (cloud provider or specialist host) | Row-level security, transactions, unique constraints, JSON columns, mature migration tooling; broadest hosting choice; fits AS-4 and AS-6 | Managed service cost is unmeasured; RLS needs discipline (connection roles, session variables) and tests |
| PostgreSQL, self-run in a container/VM | Cheapest at small scale, full control for the spikes | Backups, upgrades and restore become the founder's job; poor fit for "restore with ErasureLedger" unless scripted (S-13); not recommended for real guest data |
| MySQL/MariaDB (managed) | Mature; common on UK hosts | No row-level security as a first-class feature (the architecture prefers it); weaker fit for AS-6 |
| SQLite family (local-first or edge variants) | Very simple development; some offline-sync attractions | Concurrent multi-operator writes, backups with erasure and managed UK hosting are less proven for this workload; treat as a spike-only curiosity |

- **Verified fact:** PostgreSQL's current documentation says row security policies restrict which rows a user can read or modify; once enabled with no policy a table is default-deny; superusers and roles with `BYPASSRLS` always bypass it; a table owner bypasses it unless `FORCE ROW LEVEL SECURITY` is set; referential-integrity checks bypass it. Source: S2. **Implication:** the application must not connect as the table owner or a bypass role, which matters for AS-6.
- **Tenancy approaches to compare** (architecture 5 already proposes the first):
  1. Shared schema, `account_id` and `event_id` on every row, enforced by a data-access layer plus RLS. Least operations work; isolation depends on discipline and tests.
  2. Schema per tenant. Stronger separation; migrations and connection handling get heavier.
  3. Database per tenant. Strongest isolation; most operations work. The architecture lists it as an alternative.
  4. **Hypothesis:** option 1 suits the MVP. Spike S-06 and the cross-tenant test suite (spec 11.1) are where it would fail.
- **Hosting vs service wrappers:** some providers bundle Postgres with auth, storage and realtime. That reduces integration work but increases coupling. See layers 4 to 7.
- **Verified fact (regions):** a managed Postgres vendor (Supabase) lists London (`eu-west-2`) among its project regions (S3). A serverless Postgres vendor (Neon) lists AWS Europe (London) `aws-eu-west-2`; the same page says Object Storage, Functions, AI Gateway and Realtime are not yet listed for London (S4). **Vendor claim:** these pages can change; confirm at the time.

## 6. Layer 4: realtime

**Question (S-03):** which mechanism keeps many display clients and a control session in step, with reconnect and server-restart recovery, at acceptable operating effort?

| Option | For | Against |
|---|---|---|
| WebSockets from the app process | Two-way, low latency, no extra vendor; maps to the "internal interface" idea (AS-9) | Connection state and scaling across processes; sticky routing or a pub/sub backplane needed once there is more than one instance; hosts that only offer short-lived functions do not fit |
| Server-sent events plus normal HTTP requests | Simpler, works through most proxies, auto-reconnect built into browsers; display channels are read-only anyway | One-way; control commands still go by request; connection limits per browser/proxy need checking |
| Postgres-backed change feeds or listen/notify through a small gateway | Reuses the database as source of truth; fits "reload current state" | Fan-out to hundreds of displays through the database is a load question; needs a gateway process |
| Managed realtime service (provider-hosted channels) | Less to run | Cost, lock-in and limits unverified; data passes through a third party (privacy review); UK/EU location unclear |

- **Verified fact (one vendor's published limits):** Supabase Realtime's limits page lists, per plan, concurrent connections of 200 (Free), 500 (Pro) and 10,000 (Team), with matching messages-per-second caps (reviewer re-read the page and confirmed these tiers; the earlier "Pro without spend cap" wording was removed as unsupported). The page carries no date. Source: S5. **Treat as a vendor claim**: it shows that managed realtime has published caps that must be compared with a large event's display count, which is not yet known.
- **Hypothesis:** SSE for read-only displays plus authorised HTTP commands for control is the simplest option that satisfies AS-9; WebSockets are the fallback if control latency matters. To be tested in S-03, not decided here.
- **Cross-check:** the shortlist for hosting (layer 8) constrains this layer heavily; serverless-only hosting rules out in-process WebSockets.

## 7. Layer 5: file and media storage

**Question (S-04, S-13):** which S3-compatible store supports signed URLs, resumable or multipart uploads, UK/EU location and predictable cost, and what can we measure about revocation windows?

| Option | For | Against |
|---|---|---|
| AWS S3 (London region `eu-west-2`) | Standard S3 API behaviour; signed URLs and multipart uploads well documented; UK region exists; pairs with CloudFront and Lambda if chosen | Egress and request pricing are complicated and unverified here; more services to configure; lock-in to AWS idioms |
| Cloudflare R2 | S3-compatible; no egress charge from R2 itself; simple pricing page | No UK jurisdiction option: only EU, US and FedRAMP jurisdictions plus best-effort location hints (Western Europe is "weur"); needs a legal view on whether EU-only is acceptable for the real-data gate (A-09) |
| Provider-bundled storage (for example a database platform's storage) | One account, integrated permission model | Coupled to that platform; UK availability varies (see Neon note: object storage not yet listed for London); per-vendor signed-URL semantics need S-13 testing |
| Self-hosted S3-compatible store (for example MinIO) on own server | Cheap for local development and spikes; good for repeatable test environments | Operations burden; not for real guest data |

- **Verified fact:** AWS lists Europe (London) `eu-west-2` as a region (S6). Cloudflare's R2 documentation lists jurisdictions `eu`, `fedramp` and `us` and location hints `wnam`, `enam`, `weur`, `eeur`, `apac`, `oc`; the fetched page shows no UK option (S7). R2 pricing page: no egress charge for access through the Workers API, S3 API or r2.dev domains; Standard storage $0.015 per GB-month; Class A operations $4.50 per million; Class B $0.36 per million; free tier 10 GB-month, 1 million Class A and 10 million Class B per month (Standard only) (S8). Prices in US dollars as published; they exclude other metered services. Treat as a snapshot only.
- **Resumable uploads:** the tus protocol (version 1.0.0, 25 March 2016, community-owned, MIT licence) gives resumable uploads over HTTP, with optional extensions (creation, expiration, checksum, termination, concatenation) (S9). **Hypothesis:** tus or S3 multipart upload with a small client library meets AS-7; test on mobile networks in S-04. Whether the chosen store supports presigned multipart or needs a tus server is part of the spike.
- **Media processing** (derivatives, metadata stripping, video) is a worker concern. Candidate approaches: in-process libraries (for example libvips-based) in the worker, a separate queue-triggered function, or a managed image/video service. **Unverified:** costs, limits and privacy terms of managed services; none have been checked. Malware scanning approach remains open (architecture 8).
- **Revocation (S-13):** whether the store plus any CDN can version keys, purge quickly and keep private media out of shared caches is untested. Do not assume.

## 8. Layer 6: offline and PWA approach

**Question (S-01, S-02):** what can browsers on organisers' devices reliably hold and sync, and how long can an offline lease safely last?

| Option | For | Against |
|---|---|---|
| Hand-written service worker plus IndexedDB queue, own sync endpoint | Full control over idempotency keys, leases, wipe-at-expiry and visible sync status, which are the architecture's specific needs | More code and testing; easy to get cache invalidation wrong |
| Service worker toolkit (for example Workbox) for caching plus own IndexedDB outbox | Proven caching strategies for the app shell and display assets; less boilerplate | Another dependency; still needs a custom outbox and lease logic |
| Background Sync API for deferred sending | Browser retries sends after connectivity returns | Limited availability: MDN states it is not Baseline; do not rely on it. Use as an optional enhancement behind feature detection, with an in-page retry as the main path |
| Local-first sync engine (CRDT/replication library or a vendor sync service) | Handles merge and replication out of the box | Conflicts with the server-decides, append-only, `claimed_at`/`received_at` model; extra vendor and data-location questions; conflict policy for guest edits is a product decision (S-02); likely over-scoped for check-in append-only events |

- **Verified fact:** MDN's Background Synchronization API page marks the feature "limited availability" ("not Baseline because it does not work in some of the most widely-used browsers") and secure-context only. The fetch tool's own summary said Safari and Firefox have not shipped it, but that came from the tool's general knowledge, not from the page; **unverified** until the compatibility table is read directly. Source: S10.
- **Verified fact (storage):** MDN's storage page says best-effort storage can be evicted without warning; persistence can be requested with `navigator.storage.persist()`; Safari (macOS 14 and iOS 17 and later) applies a 7-day proactive eviction of script-created data to origins with no user interaction in seven days when cross-site tracking prevention is on; eviction is all-or-nothing per origin; Web Storage is limited to 5 MiB per origin; quotas are a share of total disk (Chrome up to 60 percent, Firefox the smaller of 10 percent or 10 GiB best-effort, Safari about 60 percent for browser apps). Source: S11. **Implication for the lease design:** an offline pack on iOS Safari can be deleted before its lease ends if the app is not used for a week, and a device that is wiped by eviction may lose unsynced check-ins. The queue must sync early and often, and S-01 must test this on real devices.
- **Hypothesis:** plain IndexedDB plus Workbox-style app-shell caching meets the minimums in decision 0017, and Lucky Draw offline stays "present already-drawn results only" (AS-12).

## 9. Layer 7: authentication

**Question:** which approach supports passwords or magic links, MFA, scoped device sessions, operator control sessions and account/collaborator roles, keeping the identity interface swappable (AS-11)?

| Option | For | Against |
|---|---|---|
| Library in the app, own user table (for example Better Auth, or Auth.js where already in use) | Data stays in our database next to RLS; no extra vendor holding guest-adjacent staff data; works with custom device-session tokens | We own security upkeep: MFA, password reset, session revocation, rate limiting |
| Framework built-in authentication (Django auth, Rails/Devise, Laravel starters) | Mature, widely reviewed; ties into the framework permission model | Tied to the language/framework choice |
| Hosted identity provider (managed auth service) | MFA, social login and account recovery handled by specialists | Cost, lock-in and data location unverified; staff personal data goes to a third party; custom scoped tokens for devices, displays and contributors still need our own implementation |
| Self-hosted identity server (for example Keycloak) | Control and standards (OIDC); no per-user vendor fee | Heavy to run for one builder; Java service to operate and patch |

- **Vendor claim, not verified (search-result summary only):** a web search result states Auth.js is now maintained by the Better Auth team, that Better Auth recommends itself for new projects, and that Auth.js continues to receive security patches and urgent fixes. The search showed an announcement dated around September 2025 on the Better Auth blog. The author could not fetch the announcement page directly; the Auth.js migration page returned 404. Treat as **vendor claim** until read at the primary source (S12). Do not choose a library on this alone.
- **Trade-off:** guest, contributor, display and device tokens (architecture 10) are not "user accounts" in any of these products. Expect to build them regardless.
- **Open:** MFA and password policy are unresolved in the architecture. Legal/ICO views on identity data for staff are for S-10.

## 10. Layer 8: hosting, development versus production

Architecture 20 lists three shapes: managed services on one cloud, platform-as-a-service, and self-managed servers (not recommended). Development hosting (A-01) and production hosting for real guest data (A-09) are separate decisions.

### Development and spike hosting (synthetic data only)

| Option | For | Against |
|---|---|---|
| Local-only (containers on the founder's machine: Postgres, S3-compatible store, mail catcher) | No account, no spend, no data leaving the machine; fits decision 0019 and the need to start spikes now | Cannot test CDN/cache behaviour, real mobile networks, TLS or multi-device displays at scale (S-03, S-13 need hosting) |
| Platform-as-a-service with a free or low-cost tier | Quick shared URL for phone and display testing | Account creation and possible spend need founder approval; free-tier limits and sleep behaviour untested |
| Single cloud provider, small footprint | Same building blocks as a probable production set-up | Account creation and spend need approval; more setup work |

### Production hosting for real guest data (decision A-09, gated)

Candidates only; not decided and not authorised.

| Option | Verified location fact | Other trade-offs (judgement) |
|---|---|---|
| AWS, London `eu-west-2` | London region is listed (S6) | Many managed parts; complex pricing; lock-in; strong tooling for backups and key management |
| Platform-as-a-service with a UK region (for example Fly.io, lhr) | The regions table lists `lhr`, London, United Kingdom, and says London can host Managed Postgres (S13) | Fewer managed services; worker, media and cost control are untested; vendor maturity for regulated data is a judgement call |
| Specialist Postgres plus object store from different vendors (for example Supabase or Neon database in London, R2 or S3 for files) | Supabase lists London (S3); Neon lists AWS London (S4); R2 has EU but no UK jurisdiction (S7) | More vendors to review for data processing and transfers; each adds a sub-processor |
| Another UK-based or European host (not researched here) | Not verified | Listed so the founder knows the field is wider than the examples; no claims made |

- **Constraint:** whether UK-only or UK/EU location is required is a legal question for the adviser (S-10, A-09). This note does not answer it.
- **Hypothesis:** developing locally first, then renting a short-lived hosted environment for S-03, S-04 and S-13, then deciding, minimises early spend.

## 11. Layer 9: continuous integration and delivery

**Question:** which CI runs lint, tests, secret scan, the accessibility check (A-07) and browser end-to-end tests, without paid services that need approval?

| Option | For | Against |
|---|---|---|
| GitHub Actions | The repo is on GitHub (CLAUDE.md section 5); no extra account | Free allowance is spend-based; end-to-end browser tests and media jobs consume minutes |
| GitLab CI or another hosted CI | Alternative if the repo moves | Needs a repo move or mirror; unnecessary today |
| Self-hosted runner on the founder's machine | No minute limits | Security exposure (runs untrusted PR code), availability tied to one machine |
| Local pre-push checks only | Zero cost | Does not satisfy "CI run observed" in A-02 or enforce the accessibility gate |

- **Verified fact:** GitHub's billing page says the GitHub Free plan includes $12 USD of compute usage per month for private repositories, expressed as money not minutes; standard GitHub-hosted runners are free in public repositories. At the Linux 2-core rate of $0.006 per minute that is roughly 2,000 minutes (the author's arithmetic, not stated on the page). Source: S14. Whether the repository is, or should be, public is a founder decision; it holds product planning documents.
- **Also needed (not options, requirements):** secret scanning, dependency audit, and an automated accessibility check that fails on serious violations (architecture 26).
- **Deployment:** repeatable deployment with no deploy to production without founder approval (CLAUDE.md section 8). CI should build and test only until approval exists.

## 12. Sources (all accessed 2026-10-30)

| ID | URL | Used for | Limitation |
|---|---|---|---|
| S1 | https://nodejs.org/en/about/previous-releases | Node.js LTS lines v26, v24, v22 | Page does not label Active versus Maintenance; EOL dates need the release schedule |
| S2 | https://www.postgresql.org/docs/current/ddl-rowsecurity.html | Row security behaviour and bypass rules | Shows PostgreSQL 18 documentation; check the version you choose |
| S3 | https://supabase.com/docs/guides/platform/regions | London `eu-west-2` region | Vendor page, may change |
| S4 | https://neon.com/docs/introduction/regions | AWS London region; features not yet in London | Vendor page, may change |
| S5 | https://supabase.com/docs/guides/realtime/limits | Realtime connection and message limits by plan | Undated page; vendor claim |
| S6 | https://docs.aws.amazon.com/general/latest/gr/rande.html | Europe (London) `eu-west-2` listed | Shows existence only, not which services are available there |
| S7 | https://developers.cloudflare.com/r2/reference/data-location/ | R2 jurisdictions and location hints; no UK option | Vendor page, may change |
| S8 | https://developers.cloudflare.com/r2/pricing/ | R2 prices and free tier | USD, snapshot; excludes other services |
| S9 | https://tus.io/protocols/resumable-upload | tus protocol 1.0.0 | Protocol spec only, not any implementation |
| S10 | https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API | Background Sync "limited availability" | Browser table was not visible in the fetch; per-browser status unverified |
| S11 | https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria | Quotas, eviction, Safari 7-day rule | General guidance; test on real devices |
| S12 | https://www.better-auth.com/blog/authjs-joins-better-auth (found by web search, not fetched) | Auth.js and Better Auth stewardship | Search summary only; page not read |
| S13 | https://docs.fly.io/reference/regions | London `lhr` region | Vendor page |
| S14 | https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions | GitHub Actions free allowance | Plan terms change |

**Count:** 14 sources (13 read, 1 found only through search). Not checked at all: any framework documentation, any auth vendor pricing, any AI provider, any UK host beyond those listed, any CDN. Do not rely on this note for those.

## 13. The question each spike must answer on this shortlist

The spike definitions are in the [risks and spikes document](../planning/MVP-TECHNICAL-RISKS-AND-SPIKES.md). Below, the extra question each spike adds once the options above exist.

| Spike | Shortlist-specific question | Candidates to compare |
|---|---|---|
| S-01 Offline per product | On the real devices and browsers in use, does a service worker plus IndexedDB outbox hold queued check-ins, survive restart and long outage, and what happens under iOS Safari 7-day eviction and storage pressure? Is Background Sync worth using at all? | Hand-written outbox; Workbox plus outbox; (local-first engine as a reference only) |
| S-02 Multi-device conflicts | Is "server receive order plus claimed time" correct under skewed clocks with the chosen database's transactions and unique constraints? Does a local-first engine's merge model conflict with append-only check-ins? | Postgres idempotency keys and constraints; local-first engine as contrast |
| S-03 Realtime | Which of SSE with HTTP commands, WebSockets, database-fed gateway and managed realtime keeps displays correct through reconnect and restart on the candidate host, and what are the connection counts for a large event? | Layer 4 options on local and one hosted environment |
| S-04 Media at scale | Does direct signed upload (S3 multipart or tus) hold under a burst on mobile networks; what is worker throughput for derivatives with in-process libraries versus a queue-triggered function? | S3 London, R2, bundled storage; in-process versus function workers |
| S-05 Rendering | Does the shared renderer perform on real display machines when built outside a framework, then inside each candidate framework? | Canvas/WebGL/SVG approaches inside React-family, Svelte and plain-JS shells |
| S-06 Lucky Draw | Do transactions, row locks and unique constraints on the candidate database give the atomic, idempotent state machine, and does a hashed snapshot recompute after erasure? | PostgreSQL (managed or local); optionally one non-Postgres for contrast |
| S-07 AI moderation | Which provider options and what content leaves our systems; what does a per-item call cost at published prices? | No candidates chosen here; needs S-10 first |
| S-08 Instagram | Unaffected by the stack; read Meta's official documentation only | None |
| S-09 Internationalisation | Does the candidate front-end framework's i18n support handle pseudo-localisation, CJK and Thai fonts, and locale formatting? | Framework i18n libraries (not researched here) |
| S-10 Data protection | Which candidate vendors become sub-processors, where is each one's data stored, and which transfers does the adviser need to review? | All vendors named in layers 4 to 8 |
| S-11 Cost | What does a low, typical and large event cost on each hosting option, from dated prices plus S-03/S-04 measurements? | Hosting options in layer 8; storage options in layer 5 |
| S-12 Agents | Not stack-dependent; but check that the chosen repo layout gives each agent a small, nameable file area | None |
| S-13 Revocation | On the candidate store and any CDN, how long do signed URLs, caches, exports and restored backups remain exposed, and can a restore re-apply the erasure ledger before access? | S3 London plus CDN, R2, bundled storage; managed Postgres restore features |

## 14. Spikes that need hosted accounts or spend (flag for founder, IA-01)

This list is a flag, not a request. The author has not created any account or called any paid API. Each item needs the founder's separate approval first (CLAUDE.md section 8).

| Spike | Can run with no account, no spend | Needs a hosted account or spend |
|---|---|---|
| S-01 | Yes: stub server plus real devices on local network or tunnel (a tunnel service may itself need an account; check) | Optional: hosted HTTPS URL for devices off the local network |
| S-02 | Yes | No |
| S-03 | Partly: local multi-client tests | Yes for a realistic hosted run and for any managed realtime vendor |
| S-04 | Partly: local S3-compatible store and local worker | Yes for a real cloud object store with mobile-network clients |
| S-05 | Yes: throwaway prototypes on real display machines | No |
| S-06 | Yes: local database | No |
| S-07 | Partly: published documentation and prices | Yes for paid API calls (also needs S-10) |
| S-08 | Yes: documentation reading only | A Meta developer account is likely needed to test anything live (unverified); not required for the desk review |
| S-09 | Yes | Translation pricing review is reading; paid translation calls would need approval |
| S-10 | Yes: data map | Adviser engagement needs approval |
| S-11 | Yes: published prices | No spend to build the model; real measurements depend on S-03 and S-04 |
| S-12 | Uses existing Claude Code | AI usage cost is already incurred; record it (architecture 17) |
| S-13 | Partly: local object store cannot represent CDN or provider caching | Yes: needs the candidate platform (signed URLs, CDN, backup/restore) |

**Summary for IA-01:** S-03, S-04 and S-13 (and the validation half of S-11) are the ones that cannot be completed honestly without at least one short-lived hosted account. S-07 would need paid API calls. The rest can start locally with no account and no spend.

## 15. Open questions

1. What languages, frameworks and tools is the founder already comfortable with? This is the biggest unknown and may collapse layers 1 and 2.
2. Is UK-only data location required, or is UK/EU acceptable? This changes whether R2 (EU but no UK jurisdiction in the fetched page) stays on the list. Legal question for A-09 and S-10.
3. What is the largest event size to design for (displays, simultaneous uploads, guests)? Without it, realtime and cost spikes have no target.
4. Is the GitHub repository private? That decides whether free CI minutes are plentiful or budgeted.
5. May the founder approve a short-lived hosted environment (and a small spend cap) for S-03, S-04 and S-13 before A-01?
6. Is a managed realtime or bundled platform acceptable as a sub-processor for guest-adjacent data, or must realtime stay in our own process?
7. Which devices and browsers do target organisers actually use at venues (iPad Safari versus Android Chrome versus laptops)? S-01 depends on it, and Safari's storage eviction rule makes it matter.
8. Is video in the MVP scope, and for which products? It changes the processing layer more than any other choice (architecture 8, S-04, S-05).
9. Does the founder want one vendor for database, storage and realtime (less integration, more coupling) or best-of-breed (more vendors to review)?
10. Authentication: are passwords, magic links, social sign-in and MFA all wanted for launch? (architecture 6, unresolved)
11. Which Node.js or other runtime version policy applies, and who owns upgrades? Not answerable from the sources read.

## 16. Limits of this note

- Written in one session from the repository documents plus 14 web sources. No prototype, benchmark or account was used. All trade-offs marked as judgement are unmeasured.
- Framework, auth-vendor and CDN claims are largely unverified. Section 12 lists what was actually read.
- Vendor pages change without notice. Re-check any figure on the day it is used.
- This note proposes no selection. A-01 must still be written, reviewed independently where substantial (CLAUDE.md section 4) and approved by the founder.
