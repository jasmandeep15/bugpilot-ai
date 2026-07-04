# BugPilot AI Project Steps

This is the execution checklist for turning BugPilot AI from a proof product into a sellable B2B SaaS.

## Current Status

- React/Vite proof product exists.
- GitHub repository exists: `jasmandeep15/bugpilot-ai`.
- Local demo runs with `npm run dev`.
- The app can generate structured reports from fake incident/support inputs.
- Backend supports deterministic mode by default and optional server-side OpenAI mode.
- Export formats exist for Markdown, GitHub Issue, Jira Ticket, and Linear Issue.
- Local beta lead capture exists through browser storage.

## Phase 1: Public Proof Product

Goal: make the product easy to demo and validate with buyers.

- [x] Build frontend proof product.
- [x] Add sample incidents and structured report generation.
- [x] Add pricing hypothesis and validation cockpit.
- [x] Push code to GitHub.
- [x] Add GitHub Pages deployment workflow with official configure/upload/deploy actions.
- [x] Enable GitHub Pages in repository settings if required.
- [x] Deploy public frontend through GitHub Pages.
- [x] Add Render deployment blueprint for frontend/backend hosting.
- [x] Add CI workflow for frontend build and backend tests.
- [ ] Share public demo link with 10 target users.
- [ ] Collect 10 pieces of feedback.

Acceptance criteria:

- A buyer can open the demo without running code locally.
- A buyer can understand the value in under 60 seconds.
- A buyer can test at least one fake incident workflow.

## Phase 2: Real AI Backend

Goal: replace deterministic report generation with a secure backend-owned LLM workflow.

- [x] Create Spring Boot backend service.
- [x] Add endpoint: `POST /api/reports/generate`.
- [x] Define request DTO: raw input, template, severity, export format.
- [x] Define response DTO: title, priority, confidence, evidence quality, report sections.
- [x] Connect frontend API action to backend with local fallback.
- [x] Add prompt templates for bug report, incident summary, support escalation, regression, and release blocker.
- [x] Add provider abstraction so OpenAI/other LLMs can be swapped.
- [x] Add optional OpenAI Responses API provider behind backend-only configuration.
- [x] Add validation and safe error responses.
- [x] Add rate limits and structured logging.
- [x] Add integration tests for report generation flow.
- [ ] Deploy backend to Render or another free backend host.

Acceptance criteria:

- Frontend calls backend instead of local generator.
- No API key is exposed in the browser.
- Backend rejects empty, oversized, or unsafe inputs.

## Phase 3: Persistence And Accounts

Goal: support real users and saved work.

- [ ] Add PostgreSQL.
- [ ] Add user accounts.
- [ ] Add workspace model.
- [ ] Persist reports, templates, and export history.
- [ ] Add basic dashboard filters.
- [ ] Add data deletion flow.

Acceptance criteria:

- A user can log in and see previous reports.
- Reports belong to the correct user/workspace.
- Sensitive data can be deleted.

## Phase 4: First Paid Workflow

Goal: build only integrations that support payment.

- [ ] Add GitHub Issues export.
- [ ] Add custom company templates.
- [ ] Add usage limits by pricing tier.
- [ ] Add Razorpay or Stripe billing.
- [ ] Add beta onboarding checklist.

Acceptance criteria:

- A paying team can generate and export real engineering tickets.
- Usage can be limited and billed.
- Setup can be repeated for multiple teams.

## Phase 5: Engineering Memory

Goal: expand from report generation into company engineering knowledge.

- [ ] Add report search.
- [ ] Add similar-past-issue suggestions.
- [ ] Add runbook generation.
- [ ] Add incident prevention recommendations.
- [ ] Add team knowledge base ingestion.

Acceptance criteria:

- BugPilot helps teams reuse old incident knowledge.
- The product becomes more valuable as a team uses it.

## Sales Execution

Weekly targets:

- Contact 25 target buyers.
- Get 3 useful replies.
- Run 1 demo.
- Publish 1 proof-of-work post.

30-day validation gate:

- 30 contacted.
- 10 useful replies.
- 3 demo users.
- 1 strong payment signal.

Continue if buyers say support-to-engineering handoff is painful and worth paying for.
Pivot if buyers like the demo but will not pay.
