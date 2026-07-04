# BugPilot AI

BugPilot AI helps small software teams turn rough customer issues into clear developer tickets.

It turns messy support tickets, incident notes, logs, and Slack/Jira fragments into:

- Developer-ready bug reports
- Reproduction steps
- Severity and priority suggestions
- Missing-information checklists
- Developer notes
- Customer-facing replies
- Incident summaries
- Markdown, GitHub, Jira, and Linear-style exports

The current version includes a React frontend and a Spring Boot backend. The backend runs in deterministic mode by default so the product can be demoed without paid AI keys. It also includes an optional OpenAI provider that runs only on the server when configured.

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
- `GET http://127.0.0.1:8080/api/reports`
- `GET http://127.0.0.1:8080/api/reports/{id}`
- `GET http://127.0.0.1:8080/actuator/health`

Backend AI mode:

```properties
bugpilot.ai.provider=deterministic
```

To use the OpenAI provider locally, set these backend environment variables before starting Spring Boot:

```bash
BUGPILOT_AI_PROVIDER=openai
OPENAI_MODEL=gpt-5.4-mini
OPENAI_API_KEY=sk-...
```

On Windows PowerShell:

```powershell
$env:BUGPILOT_AI_PROVIDER="openai"
$env:OPENAI_MODEL="gpt-5.4-mini"
$env:OPENAI_API_KEY="sk-..."
```

Never put `OPENAI_API_KEY` in frontend `.env.local` or static hosting settings.

Database mode:

- Local/dev default: in-memory H2 using PostgreSQL compatibility mode.
- Production: set `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD` to a PostgreSQL database.
- BugPilot stores generated report output and report metadata. It does not store the raw pasted issue input.

Frontend environment:

```bash
cp .env.example .env.local
```

Set `VITE_API_BASE_URL` when the backend is deployed.

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

This repository includes a GitHub Pages workflow at `.github/workflows/deploy-pages.yml`. The workflow configures Pages, builds the Vite app, uploads `dist`, and deploys through the official GitHub Pages action.

Current public frontend:

- https://jasmandeep15.github.io/bugpilot-ai/

If GitHub Pages needs to be reconfigured:

1. Open the GitHub repository.
2. Go to `Settings` -> `Pages`.
3. Set the source to `GitHub Actions`.
4. Run the `Deploy BugPilot AI to GitHub Pages` workflow or push to `main`.

## Backend Deployment

The repo includes a Render blueprint in `render.yaml` and a backend Dockerfile.

Recommended free deployment path:

1. Create a Render account.
2. Connect the GitHub repository `jasmandeep15/bugpilot-ai`.
3. Create services from `render.yaml`.
4. Confirm backend health at `/actuator/health`.
5. Set the frontend `VITE_API_BASE_URL` to the deployed backend URL.

For real AI generation on Render, set these backend service environment variables:

- `BUGPILOT_AI_PROVIDER=openai`
- `OPENAI_MODEL=gpt-5.4-mini`
- `OPENAI_API_KEY=<server-side secret>`

## Product Positioning

BugPilot AI is not a generic chatbot. The wedge is simple: fewer back-and-forth questions before developers can act.

The product should help small software teams answer:

- What exactly is broken?
- Who is affected?
- Can engineering reproduce it?
- What evidence exists?
- What information is missing?
- What can the team safely tell the customer?
- Is this a bug, incident, regression, or release blocker?

## Important Data Rule

Do not paste confidential employer data, bank data, customer data, production secrets, internal logs, private screenshots, tokens, API keys, or proprietary workflows into the demo.

Use fake/sample issues for demos until a secure backend, privacy policy, and customer data handling process exist.

## Next Technical Milestones

1. Deploy the backend on Render and point `VITE_API_BASE_URL` at it.
2. Add PostgreSQL persistence for users, reports, templates, and leads.
3. Add authentication and account workspaces.
4. Add GitHub Issues export as the first real integration.
5. Add billing only after users show willingness to pay.
