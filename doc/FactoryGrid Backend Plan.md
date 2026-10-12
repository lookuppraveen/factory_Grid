# FactoryGrid Backend Plan

Oct 10, 2026 · @Praveen Kumar

One backend developer builds the FactoryGrid API from Oct 12, 2026, freezes code on Jan 14, 2027, supports beta testing 15–27 Jan and hands over the final delivery on Jan 30, 2027. This plan follows the master copy, Doc, cut down to what one developer can deliver for beta in 13 working weeks. The frontend developer works in parallel from the companion Frontend Plan.

## At a glance

&#91;embedded content: delivery timeline · 7 phases, beta and delivery, both developers\]

Each hollow diamond is the day the next phase's contract freezes, a few days before that phase starts, so the frontend developer always has a mock to build against.

## Scope for 30 Jan

The beta covers the whole business flow: register, get approved, browse the catalog, raise an RFQ, accept a quote, pay, ship and track. Mobile apps, carrier APIs, SMS/WhatsApp, AI models and the full split into microservices move to after launch. The master plan budgets about 31 weeks with four workstreams; two developers have 13 weeks before beta, so the rest cannot fit.

| Area | In beta (30 Jan) | After launch (Feb–Apr 2027) |
| --- | --- | --- |
| Identity | IAM ported to Node.js, 8 roles, invites, TOTP 2FA, password reset, email verification | Per-device sessions for mobile |
| Partners and compliance | Onboarding wizard, profiles, document uploads, GST/PAN check via one provider, manual admin approval, audit log | AI document review, MCA checks, virus scan upgrade |
| Catalog and pricing | Products, 3-level categories, brands, attributes, UoM, tax, CSV import, price lists, margin rules, platform fees | Provider data feeds |
| Sourcing | RFQ to accepted quote, rules-based manufacturer matching, quote comparison, customer quotation, QA threads | AI matching model |
| Orders and payments | Master order, admin approval, sub-order split, production status, proforma and tax invoices (PDF), Razorpay advance and invoice payments, refunds | Daily reconciliation dashboard |
| Logistics | Shipment created by hand with carrier name and tracking number, status updates, delivery confirmation | Blue Dart and Delhivery APIs, temperature logs |
| Notifications | Email at each hand-off, in-app notifications over Server-Sent Events | SMS, WhatsApp, push, Factory Buddy conversations |
| Reporting | One summary dashboard per role, CSV export of orders and invoices | reporting-service, read models, PDF exports |
| Platform | One NestJS app with module boundaries, BullMQ jobs, staging and production | Kong gateway, RabbitMQ, split into services |
| Mobile | None | Buyer and Partner apps (master plan M0–M3) |

## Hand-offs to the frontend developer

The backend freezes each phase's OpenAPI contract about two weeks before that phase goes live on staging, so the frontend builds against mocks and never waits. These dates are the backend developer's commitments to the frontend; a missed contract date stalls the other developer, so it outranks backend feature work.

| Phase | Contract frozen | Live on staging | Integration day |
| --- | --- | --- | --- |
| 1 Identity | Wed 14 Oct | Wed 28 Oct | Fri 30 Oct |
| 2 Partners, files, compliance | Wed 28 Oct | Wed 18 Nov | Fri 20 Nov |
| 3 Catalog and pricing | Wed 18 Nov | Wed 2 Dec | Fri 4 Dec |
| 4 Sourcing (RFQ to quote) | Wed 2 Dec | Wed 16 Dec | Fri 18 Dec |
| 5 Orders and payments | Wed 16 Dec | Mon 4 Jan | Tue 5 Jan |
| 6 Logistics, notifications, dashboards | Wed 30 Dec | Mon 11 Jan | Tue 12 Jan |

How the two developers work together:

- **Contract first.** The backend developer writes `contracts/<module>.yaml` from `frontend/src/types/index.ts`. The frontend developer reviews it within one working day. It is frozen when both approve the pull request.
- **Change after freeze.** A breaking change needs both developers' sign-off and a same-day update of the generated types. Adding an optional field needs only a heads-up.
- **Generated types.** CI regenerates `@factorygrid/contracts` on every contract merge. The frontend generates its mock handlers (MSW) from the same spec.
- **Integration day.** The frontend switches that phase's screens from mock to staging, and both developers run the exit-gate flow together and fix what breaks that day.
- **Daily sync.** A 15-minute call each morning covers blockers, contract questions and staging status. A Friday demo goes to the product owner.
- **Staging.** Backend deploys to staging on every merge to `main`. A failing staging deploy is fixed before new work starts.

## Architecture for a one-developer backend

Ship one NestJS application, `factorygrid-api`, built from modules that keep the master plan's 12 service boundaries. Each module owns its own PostgreSQL schema and talks to other modules only through their service classes or events. A module can move into its own service after launch with little code change, as the master plan's "Start with fewer deployable apps" section already allows.

| Topic | Master plan | Backend plan for beta | Why |
| --- | --- | --- | --- |
| Deployables | 12 services, starting as 4 apps | 1 app, 11 modules, one schema per module | One developer cannot run and deploy 12 services |
| Gateway | Kong | NestJS guards for JWT and roles, `@nestjs/throttler`, CORS in the app | Kong adds ops work with no beta benefit; add it after launch |
| Events | RabbitMQ with outbox per service | Outbox table + in-process event emitter, BullMQ for retries and slow work | Same reliability without a broker to run |
| Databases | One PostgreSQL database per service | One PostgreSQL 17 instance, one schema per module, one Prisma schema file per module | Keeps the boundaries, one backup |
| Stack | NestJS, Fastify, Prisma, BullMQ, Redis, pino, Jest, Testcontainers | Unchanged |  |
| API standards | `/api/v1`, `ApiResponse` / `ErrorResponse`, paise, Idempotency-Key | Unchanged | The frontend already reads these shapes |
| Mobile endpoints | Devices, app-config, sync | Deferred, except refresh tokens stored per session | No mobile apps in beta |

Modules: `iam`, `partner`, `file`, `compliance`, `catalog`, `pricing`, `sourcing`, `order`, `payment`, `logistics`, `notification`, plus a thin `dashboard` module in place of reporting-service.

## Phase-by-phase tasks

Seven phases run from 12 Oct to code freeze on 14 Jan. Each one ends with its exit gate passed on staging. About half a day a week goes to writing the next phase's contract. The plan assumes Diwali (9–10 Nov), 25 Dec and 1 Jan are off.

### Phase 0: Foundations — 12–16 Oct

- [ ] pnpm workspace + Nx; `backend/apps/factorygrid-api`, `libs/` for auth, errors, prisma, outbox, testing
- [ ] API standards doc: `/api/v1`, `ApiResponse` / `ErrorResponse`, paging, Idempotency-Key, UTC dates, money in paise
- [ ] docker-compose: PostgreSQL 17, Redis, MinIO, Mailpit
- [ ] GitHub Actions: lint, type-check, Jest, OpenAPI lint, contract test, Docker image
- [ ] Staging environment with database, Redis, S3 bucket and auto-deploy from `main`
- [ ] pino logs with request ID, health endpoint, Swagger at `/docs`
- [ ] Write and freeze the Identity contract (Wed 14 Oct)
- [ ] Apply for Razorpay live KYC, GST/PAN provider account and email provider (SES or SendGrid) this week

Exit gate: a hello-world module deploys to staging behind JWT auth from CI.

### Phase 1: Identity — 19–30 Oct

- [ ] `prisma db pull` on the existing IAM schema and baseline it; keep tables and BCrypt hashes
- [ ] Port login, refresh, logout, me, register/buyer, register/manufacturer with the same JSON shapes
- [ ] Rewrite `IamSecurityAndAuthTest` and `UserRepositoryTest` as Jest + Supertest; all pass
- [ ] Link users to organizations; user admin APIs (invite, deactivate, assign roles)
- [ ] Role guard on every endpoint, with a 403 test per role
- [ ] TOTP 2FA server-side (move `totpUtils.ts` logic), password reset, email verification, login audit
- [ ] Notification module v1: transactional email with templates, sent as BullMQ jobs
- [ ] Write and freeze the Partners/files/compliance contract (Wed 28 Oct)

Exit gate: all 8 roles register or are invited, verify email, log in with 2FA and reset password; existing users log in with current passwords. Java IAM retired.

### Phase 2: Partners, files, compliance — 2–20 Nov

- [ ] Partner module: buyer and manufacturer organizations, onboarding drafts per wizard step, profiles, capabilities, facilities, certifications, customer segments
- [ ] File module: presigned S3 uploads, document versions, expiry dates
- [ ] Compliance module: verification cases (customer, manufacturer, brand, trademark), GST/PAN check through one provider adapter with a fake, admin approval queue, audit log
- [ ] Move GST connector logic from the frontend to the backend adapter; keys server-side only
- [ ] Write and freeze the Catalog/pricing contract (Wed 18 Nov)

Exit gate: a buyer and a manufacturer onboard, upload documents and are approved or rejected by an admin, every step audited.

### Phase 3: Catalog and pricing — 23 Nov–4 Dec

- [ ] Catalog module: products, 3-level categories, brands, attributes, UoM, tax rules, product-manufacturer mapping
- [ ] CSV/Excel bulk import as a BullMQ job with an error report
- [ ] Server-side search, filters and paging on product lists
- [ ] Pricing module: price lists by segment, margin rules by scope, platform fees, price calculation API; integer paise and decimal.js only
- [ ] Rounding unit tests on every price rule
- [ ] Write and freeze the Sourcing contract (Wed 2 Dec)

Exit gate: buyers search a catalog with live prices that match their segment's margin rules.

### Phase 4: Sourcing — 7–18 Dec

- [ ] RFQ create, submit and distribute to matched manufacturers (rules-based scoring endpoint)
- [ ] Manufacturer quotes, buyer quote comparison, customer quotation with margins applied
- [ ] Sales qualification and QA threads
- [ ] Email at each hand-off
- [ ] Write and freeze the Orders/payments contract (Wed 16 Dec)

Exit gate: an RFQ goes from draft to an accepted quote end to end, with emails at each step.

### Phase 5: Orders and payments — 21 Dec–5 Jan

- [ ] Order module: master order from accepted quote, admin approval, split into sub-orders per manufacturer, production status, status history
- [ ] Payment module: proforma invoice, advance payment (percentage or fixed), Razorpay order created server-side
- [ ] Razorpay `payment.captured` webhook: raw-body signature check, idempotent by event ID, outbox event to orders and notifications
- [ ] Tax invoice PDF (pdfmake), partial payments, refunds, overdue check as a scheduled job
- [ ] Write and freeze the Logistics/notifications/dashboards contract (Wed 30 Dec)

Exit gate: an accepted quote becomes a paid, split order in Razorpay test mode, ledger totals match.

### Phase 6: Logistics, notifications, dashboards — 6–12 Jan

- [ ] Logistics module: shipment per sub-order with carrier name and tracking number, status updates, delivery confirmation closes the sub-order
- [ ] In-app notifications stored per user, streamed over Server-Sent Events, read/unread
- [ ] Dashboard module: one summary endpoint per role (counts and totals), CSV export of orders and invoices

Exit gate: a sub-order ships, its status reaches the buyer screen without reload, and delivery closes it.

### Hardening — 12–14 Jan

- [ ] Security pass: OWASP ASVS level 2 checklist on auth, uploads and payments; `pnpm audit` clean
- [ ] k6 smoke test on login, catalog search, RFQ and payment paths
- [ ] Production environment, secrets in a secret manager, Razorpay live keys loaded but switched off
- [ ] Daily database backup and one restore drill
- [ ] Seed data and beta tester accounts on the beta environment
- [ ] Code freeze end of day Thu 14 Jan

## Beta testing and launch

The beta runs 15–27 Jan on the production environment with invited pilot buyers and manufacturers and Razorpay in test mode. Go-live is 28 Jan and final delivery is 30 Jan. After code freeze only bug fixes merge.

| Date | Milestone |
| --- | --- |
| Fri 15 Jan | Beta opens: pilot accounts get invites |
| 15–21 Jan | Round 1: testers run the full flow; daily triage at 10:00; fixes deploy daily |
| Fri 22 Jan | Round 2 build: all P0 and P1 bugs from round 1 fixed |
| Mon 25 Jan | Release candidate; no new fixes except P0 |
| Tue 26 Jan | Republic Day, off |
| Wed 27 Jan | Go/no-go with the product owner |
| Thu 28 Jan | Production go-live: Razorpay live keys on, test data cleared |
| Fri 29 Jan | Hypercare: both developers watch logs and fix live issues |
| Sat 30 Jan | Final delivery: handover and sign-off |

| Severity | Meaning | Fix by |
| --- | --- | --- |
| P0 | Flow blocked, wrong money, data leak, security hole | Same day |
| P1 | Major feature broken, no workaround | Within 2 working days |
| P2 | Works with a workaround, visual issues | Before go-live if time allows |
| P3 | Cosmetic or wish list | Post-launch backlog |

Backend duties:

- [ ] Seed catalog, categories, price lists and pilot accounts before 15 Jan
- [ ] Watch error logs and the BullMQ failed-job queue every morning
- [ ] Reproduce each backend bug as a failing test before fixing it
- [ ] Run a Razorpay test payment and refund end to end every beta day
- [ ] Before go-live: switch to Razorpay live keys, clear test data, take a backup
- [ ] Handover pack for 30 Jan: Swagger/OpenAPI specs, environment and secrets list, deploy and rollback runbook, backup and restore runbook, provider accounts list, known-issues list

## Risks and open questions

| Risk | Effect | Mitigation |
| --- | --- | --- |
| One backend developer is a single point of failure | Any sick week slips beta | Contract-first specs and tests document the work; Phase 6 and dashboards are the first to trim |
| Phase 5 lands over Christmas and New Year | Orders and payments run late | Freeze its contract on 16 Dec so the frontend is ready; keep refunds and overdue jobs last |
| Razorpay live KYC, GST provider and email provider take weeks | Go-live blocked on paperwork | Apply in Phase 0; build against sandboxes and fakes |
| IAM port changes behaviour | Existing users cannot log in | Port with the same schema and shapes first; Java tests are the acceptance suite |
| Late contract changes | Frontend rework | Freeze dates above; breaking changes need both developers' sign-off |
| Money maths with JavaScript floats | Wrong invoice totals | Integer paise, decimal.js, rounding tests |

Open questions:

- [ ] Confirm the beta scope cuts in the Scope section with the product owner
- [ ] How many pilot buyers and manufacturers, and who recruits them by 8 Jan
- [ ] Hosting for the API: managed containers (for example AWS ECS or Render) or a VM
- [ ] Email provider and GST/PAN verification provider
- [ ] Is a third developer or QA available in December if Phase 4 or 5 slips
