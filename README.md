# BugPilot AI

BugPilot AI is a proof product for a global B2B engineering-ops SaaS.

It turns messy support tickets, incident notes, logs, and Slack/Jira fragments into:

- Engineer-ready bug reports
- Reproduction steps
- Severity and priority suggestions
- Missing-information checklists
- Developer handoff notes
- Customer-facing replies
- RCA drafts
- Markdown, GitHub, Jira, and Linear-style exports

The current version is intentionally frontend-only so it can be demoed, validated, and iterated quickly before adding a paid LLM backend.

## Run Locally

Frontend:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

Backend:

```bash
cd backend
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The backend exposes:

- `POST http://127.0.0.1:8080/api/reports/generate`
- `GET http://127.0.0.1:8080/actuator/health`

## Build

```bash
npm run build
```

Backend tests:

```bash
cd backend
./mvnw test
```

## Project Execution Steps

The full execution checklist is maintained in [PROJECT_STEPS.md](./PROJECT_STEPS.md).

## Public Demo Deployment

This repository includes a GitHub Pages workflow at `.github/workflows/deploy-pages.yml`.

If GitHub Pages is not already active:

1. Open the GitHub repository.
2. Go to `Settings` -> `Pages`.
3. Set the source to `GitHub Actions`.
4. Run the `Deploy BugPilot AI to GitHub Pages` workflow or push to `main`.

## Product Positioning

BugPilot AI is not a generic chatbot. The wedge is support-to-engineering handoff quality.

The product should help small SaaS teams answer:

- What exactly is broken?
- Who is affected?
- Can engineering reproduce it?
- What evidence exists?
- What information is missing?
- What can support safely tell the customer?
- Is this a bug, incident, regression, or release blocker?

## Important Data Rule

Do not paste confidential employer data, bank data, customer data, production secrets, internal logs, private screenshots, tokens, API keys, or proprietary workflows into the demo.

Use fake/sample incidents for demos until a secure backend, privacy policy, and customer data handling process exist.

## Next Technical Milestones

1. Add a Spring Boot API for report generation requests.
2. Add PostgreSQL persistence for users, reports, templates, and leads.
3. Add LLM provider integration behind a service interface.
4. Add authentication and account workspaces.
5. Add GitHub Issues export as the first real integration.
6. Add billing only after users show willingness to pay.
