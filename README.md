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

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build

```bash
npm run build
```

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
