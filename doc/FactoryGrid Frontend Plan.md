# FactoryGrid Frontend Plan

Oct 10, 2026 · @Praveen Kumar

One frontend developer moves the 72 existing FactoryGrid screens from mock data to live APIs from Oct 12, 2026, freezes code on Jan 14, 2027, supports beta testing 15–27 Jan and hands over the final delivery on Jan 30, 2027. This plan follows the master copy, Doc, cut down to the beta scope. The frontend works against mock APIs built from each frozen contract, so it never waits for the backend developer, who works in parallel from the companion Backend Plan.

## At a glance

&#91;embedded content: delivery timeline · 7 phases, beta and delivery, both developers\]

Each hollow diamond is the day a phase's contract freezes and its mocks become available, a few days before that phase starts.

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

Screens outside this scope stay in the app behind a "Coming soon" state or are hidden from the menu by role; they are not deleted.

## What the frontend gets from the backend, and when

Each phase's contract freezes about two weeks before its APIs go live on staging. The frontend builds screens on mocks from the freeze date, then switches to staging on integration day. Contract review is the frontend developer's one hard duty to the backend: approve or comment within one working day.

| Phase | Contract frozen (mocks start) | Live on staging | Integration day |
| --- | --- | --- | --- |
| 1 Identity | Wed 14 Oct | Wed 28 Oct | Fri 30 Oct |
| 2 Partners, files, compliance | Wed 28 Oct | Wed 18 Nov | Fri 20 Nov |
| 3 Catalog and pricing | Wed 18 Nov | Wed 2 Dec | Fri 4 Dec |
| 4 Sourcing (RFQ to quote) | Wed 2 Dec | Wed 16 Dec | Fri 18 Dec |
| 5 Orders and payments | Wed 16 Dec | Mon 4 Jan | Tue 5 Jan |
| 6 Logistics, notifications, dashboards | Wed 30 Dec | Mon 11 Jan | Tue 12 Jan |

How the two developers work together:

- **Contract first.** The backend developer writes `contracts/<module>.yaml` from `frontend/src/types/index.ts`. The frontend developer checks every field each screen needs is there, then approves. It is frozen when both approve the pull request.
- **Change after freeze.** A breaking change needs both developers' sign-off and a same-day update of the generated types. Adding an optional field needs only a heads-up.
- **Generated types.** CI regenerates `@factorygrid/contracts` on every contract merge; a contract change breaks the frontend build, not production.
- **Integration day.** The frontend switches that phase's screens from mock to staging, and both developers run the exit-gate flow together and fix what breaks that day.
- **Daily sync.** A 15-minute call each morning covers blockers, contract questions and staging status. A Friday demo goes to the product owner.
- **Hosting.** The frontend developer owns the Vercel project, its preview deploys and its environment variables.

## How to work ahead of the backend

Every screen talks to the API through one generated client and TanStack Query hooks, and a per-module switch decides whether those calls hit Mock Service Worker (MSW) or staging. Built that way, a screen finished on mocks goes live by flipping its switch, not by rewriting it.

1. On the freeze day, pull the new `@factorygrid/contracts` types and generate MSW handlers from the same spec.
2. Add realistic mock data per handler, including empty, error and slow responses, so loading and error states get built.
3. Write query hooks in `src/api/<domain>/` (for example `useRfqs`, `useSubmitQuote`) on `openapi-fetch`.
4. Replace the module's `AppContext` reads with those hooks; delete that domain's slice of `mockData.ts`.
5. On integration day, set the module's switch to live, run the phase's Playwright flow against staging, and log any mismatch to the backend developer the same hour.

Rules while migrating each module (from the master plan):

- Keep `AppContext` only for UI state such as theme and sidebar.
- Retire hand-written types in `src/types/index.ts` as each domain moves to generated types.
- Split modules over about 800 lines into a page, sub-components and hooks while touching them, not as a separate rewrite.
- Every list has server-side paging, a loading state, an empty state and an error state.
- Forms validate on the client for speed; server validation errors are the source of truth and show per field.
- No secrets or provider keys in frontend code or `VITE_` variables.

## Phase-by-phase screens and tasks

Seven phases run from 12 Oct to code freeze on 14 Jan, in the same dates as the backend. Each one ends when its screens pass the exit-gate flow on staging with no mocks. The plan assumes Diwali (9–10 Nov), 25 Dec and 1 Jan are off.

### F0: Foundations — 12–16 Oct

- [ ] Remove `VITE_RAZORPAY_KEY_SECRET` and `verifyRazorpaySignature` from `razorpayService.ts`, and every provider key from `VITE_` variables (day 1)
- [ ] Move `frontend/` into the pnpm workspace; import `@factorygrid/contracts`
- [ ] One HTTP layer on `openapi-fetch`: `VITE_API_BASE_URL`, bearer token, refresh on 401, request ID header, error toasts from `ErrorResponse`
- [ ] TanStack Query set up with standard loading, error and retry behaviour
- [ ] MSW with a per-module mock/live switch
- [ ] Route guards by role from `/me`; remove hard-coded role switching
- [ ] Vitest + Testing Library, Playwright, and both in CI
- [ ] Update `vercel.json` for the workspace (`pnpm install --frozen-lockfile`, `pnpm --filter frontend build`)
- [ ] Review the Identity contract by Wed 14 Oct; start login screens on mocks

Exit gate: the app builds from the workspace on Vercel, logs in against the Identity mock, and has no secret in its bundle.

### F1: Identity — 19–30 Oct

- [ ] LoginPage, Security2FA, BuyerSecuritySettings, Settings, password reset, email verification, invite acceptance
- [ ] User admin screens: invite, deactivate, assign roles
- [ ] Remove the auth slice from `AppContext`
- [ ] Shared building blocks for later phases: server-paged data table, form field errors from the API, file upload with presigned URL, empty/error/loading states
- [ ] Review the Partners/files/compliance contract by Wed 28 Oct

Exit gate: login, 2FA, reset and invite work against the Node.js IAM on staging for all 8 roles.

### F2: Partners and compliance — 2–20 Nov

- [ ] Buyer and Manufacturer onboarding wizards, saving each step as a draft
- [ ] Profile, ManufacturerProfilePage, Customer, CustomerSegmentMaster
- [ ] CustomerVerification, ManufacturerVerification, Brand and Trademark verification
- [ ] All Admin\*Verification screens and monitors, AdminApproval, Compliance (audit log view)
- [ ] Delete partner and compliance mock data
- [ ] Review the Catalog/pricing contract by Wed 18 Nov

Exit gate: a buyer and a manufacturer onboard with real uploads and an admin approves or rejects them.

### F3: Catalog and pricing — 23 Nov–4 Dec

- [ ] ProductCatalog, CategoryMaster, BrandMaster, AttributeMaster, ProductUom, ProductTax, ProductManufacturerMapping
- [ ] ProductPrice, MarginEngine; Buyer and Manufacturer product catalogs
- [ ] CSV/Excel import screen with job progress and error report download
- [ ] Server-side search, filter and paging on every catalog list
- [ ] Review the Sourcing contract by Wed 2 Dec

Exit gate: buyers search the catalog and see prices from the pricing API that match their segment.

### F4: Sourcing — 7–18 Dec

- [ ] RFQ, Quote, AIMatching (shows rules-based scores), ManufacturerAssignedRFQs, ManufacturerQuoteSubmissions
- [ ] BuyerQuoteComparison, CustomerQuotation, SalesQualification
- [ ] BuyerQa, RaiseQaModal, AdminQaGovernance, AdminRfq and Quote monitors
- [ ] Review the Orders/payments contract by Wed 16 Dec

Exit gate: RFQ to accepted quote passes the Playwright flow on staging.

### F5: Orders and payments — 21 Dec–5 Jan

- [ ] Order, MasterOrderSplitting, ManufacturerSubOrder, ProductionExecution
- [ ] BuyerOrderTracking, AdminOrderMonitor, ManufacturerOrderHistory
- [ ] Invoice (PDF download), BuyerAdvancePayments, Accounts
- [ ] `razorpayService` only opens Checkout with the order ID from the API; payment status is read back from the API, never from the checkout callback
- [ ] Review the Logistics/notifications/dashboards contract by Wed 30 Dec

Exit gate: a Razorpay test payment updates the order status through the backend webhook.

### F6: Logistics, notifications, dashboards — 6–12 Jan

- [ ] Shipment screen: carrier name, tracking number, status updates, delivery confirmation
- [ ] Notifications bell and list over Server-Sent Events, read/unread
- [ ] Dashboards for each role and ManufacturerDashboard on the summary API; CSV export buttons
- [ ] Hide or mark "Coming soon": FactoryBuddyCommunicationDesk, IntegrationsSettings, advanced Analytics and Reports

Exit gate: a shipment status change shows on the buyer's screen without reload; dashboards show live numbers.

### Hardening — 12–14 Jan

- [ ] Delete `mockData.ts` and the data parts of `AppContext`
- [ ] Full Playwright regression of all exit-gate flows against staging
- [ ] Check Chrome, Edge, Safari and a phone-width layout on the main buyer and manufacturer screens
- [ ] Route-level code splitting; error tracking (Sentry) on
- [ ] Production Vercel environment pointing at the production API
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

Frontend duties:

- [ ] Before 15 Jan: a short tester guide per role (buyer, manufacturer, admin) and an in-app "Report a problem" link to the bug tracker
- [ ] Triage each bug report: frontend, backend or contract, and tag the owner the same morning
- [ ] Watch Sentry errors every morning
- [ ] Rerun the Playwright regression on every beta deploy
- [ ] Before go-live: switch Vercel production to the production API, confirm no mock switch is on, check the bundle for secrets
- [ ] Handover pack for 30 Jan: build and deploy steps, environment variables list, screen-to-API map, Playwright suite guide, known-issues list

## Risks and open questions

| Risk | Effect | Mitigation |
| --- | --- | --- |
| 72 screens for one developer | F2 and F5 run long | Split big modules only while touching them; hide out-of-scope screens rather than migrate them |
| `AppContext` (5,507 lines) and `mockData.ts` (7,132 lines) are tangled | Removing one slice breaks other screens | One domain per phase; delete its slice only after its Playwright flow passes |
| Mocks drift from the real API | Surprises on integration day | Generate MSW handlers from the frozen spec, never by hand |
| Phase 5 lands over Christmas and New Year | Payment screens run late | Contract frozen 16 Dec, so screens are built on mocks before the break |
| Backend slips a staging date | Frontend cannot finish its exit gate | Keep building the next phase on mocks; integrate as soon as staging is up |
| Secrets in the browser bundle today | Razorpay secret exposed | Removed on day 1 of F0 |

Open questions:

- [ ] Confirm the beta scope cuts in the Scope section with the product owner
- [ ] Which out-of-scope screens are hidden and which show "Coming soon"
- [ ] Bug tracker for beta testers (GitHub Issues, Jira or a form)
- [ ] Browsers and minimum screen width to support at launch
