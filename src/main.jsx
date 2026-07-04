import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  BadgeDollarSign,
  BookOpenText,
  Check,
  ChevronDown,
  Clipboard,
  Copy,
  FileText,
  Github,
  LayoutDashboard,
  Mail,
  MessageSquareText,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Wand2
} from 'lucide-react';
import './styles.css';

const examples = [
  {
    id: 'payment-failure',
    title: 'Payment failure bug',
    type: 'Bug report',
    severity: 'High',
    input:
      'Customer ACME says checkout fails for annual plan. They see "payment could not be processed" after clicking Pay. Started after yesterday payment gateway migration. Browser Chrome. User retried 3 times. Logs show POST /api/billing/charge 500 and Stripe token missing. Only annual plan seems affected. Monthly works. Support promised update in 2 hours.'
  },
  {
    id: 'api-timeout',
    title: 'API timeout incident',
    type: 'Incident RCA',
    severity: 'Critical',
    input:
      'From 10:05 to 10:42 UTC, customers reported dashboard loading forever. p95 latency on /api/reports jumped to 18s. DB CPU 95%. Recent deployment added joins for account usage summary. Rollback at 10:38 improved latency. 18 enterprise accounts affected. Need RCA and customer note.'
  },
  {
    id: 'login-issue',
    title: 'Login support escalation',
    type: 'Support escalation',
    severity: 'Medium',
    input:
      'Three users from same company cannot login after SSO setup. They get redirected back to login page. Admin changed Okta metadata this morning. No clear error in UI. Backend logs say invalid audience for SAML response. Need engineering ticket and customer response.'
  }
];

const templates = ['Bug report', 'Incident RCA', 'Support escalation', 'Regression report', 'Release blocker'];
const severities = ['Low', 'Medium', 'High', 'Critical'];

const defaultInput = examples[0].input;

function pickSeverity(text, fallback) {
  const lowered = text.toLowerCase();
  if (lowered.includes('outage') || lowered.includes('critical') || lowered.includes('down') || lowered.includes('500')) return 'Critical';
  if (lowered.includes('payment') || lowered.includes('enterprise') || lowered.includes('blocked')) return 'High';
  if (lowered.includes('cannot') || lowered.includes('error') || lowered.includes('failed')) return 'Medium';
  return fallback;
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanSentence(text) {
  return text.replace(/\s+/g, ' ').replace(/[.?!]+$/, '').trim();
}

function inferArea(text) {
  const lowered = text.toLowerCase();
  if (lowered.includes('payment') || lowered.includes('billing') || lowered.includes('stripe')) return 'Billing and payments';
  if (lowered.includes('login') || lowered.includes('sso') || lowered.includes('saml') || lowered.includes('okta')) return 'Authentication';
  if (lowered.includes('api') || lowered.includes('latency') || lowered.includes('timeout')) return 'API performance';
  if (lowered.includes('database') || lowered.includes('db')) return 'Database';
  return 'Application workflow';
}

function generateReport({ input, template, severity }) {
  const sentences = splitSentences(input);
  const area = inferArea(input);
  const computedSeverity = pickSeverity(input, severity);
  const summary = cleanSentence(sentences[0] || 'A customer-facing issue was reported and needs engineering triage.');
  const impact = cleanSentence(sentences.find((line) => /affected|customer|users|enterprise|checkout|dashboard|login/i.test(line)) || summary);
  const evidence = sentences.filter((line) => /log|error|500|latency|cpu|token|audience|redirect|browser|api|db/i.test(line));
  const suspectedCause = cleanSentence(
    sentences.find((line) => /migration|deployment|changed|added|metadata|rollback|configuration|release/i.test(line)) ||
    sentences.find((line) => /started after|began after|since/i.test(line)) ||
    'Root cause is not confirmed yet. Engineering should validate recent changes, logs, and affected workflow.'
  );
  const missingInfo = [
    'Exact affected user/account IDs or anonymized reproducible test account',
    'First known occurrence timestamp and whether the issue is still active',
    'Relevant request IDs, trace IDs, logs, or screenshots',
    'Expected behavior confirmed by product/support owner',
    'Recent deployments, configuration changes, or third-party incidents'
  ];
  const qualitySignals = [
    { label: 'Customer impact', found: /customer|user|affected|account|enterprise|client/i.test(input) },
    { label: 'Technical evidence', found: /log|trace|request|500|latency|cpu|token|api|db|saml|error/i.test(input) },
    { label: 'Timeline', found: /\d{1,2}:\d{2}|today|yesterday|morning|started|from|after/i.test(input) },
    { label: 'Suspected change', found: /deployment|migration|changed|release|rollback|configuration|metadata|added/i.test(input) }
  ];
  const evidenceScore = qualitySignals.filter((signal) => signal.found).length;
  const confidence =
    evidenceScore >= 4 ? 'High' :
    evidenceScore === 3 ? 'Medium' :
    'Low';

  return {
    title: `${area}: ${summary}`,
    template,
    severity: computedSeverity,
    priority: computedSeverity === 'Critical' ? 'P0' : computedSeverity === 'High' ? 'P1' : computedSeverity === 'Medium' ? 'P2' : 'P3',
    area,
    summary,
    impact,
    suspectedCause,
    reproductionSteps: [
      `Open the affected ${area.toLowerCase()} workflow in a test or staging account.`,
      'Repeat the user action described in the ticket using the same plan, browser, or SSO configuration where available.',
      'Capture the visible error, network request, response code, and backend trace.',
      'Compare against an unaffected account or plan to isolate configuration versus code behavior.'
    ],
    expectedActual: {
      expected: 'The user should complete the workflow without errors, redirects, or excessive latency.',
      actual: summary
    },
    qualitySignals,
    confidence,
    evidence: evidence.length ? evidence : ['No structured logs or traces were included in the original note.'],
    missingInfo,
    developerHandoff:
      `Please triage ${area.toLowerCase()} as ${computedSeverity} severity. Start by validating the suspected change: ${suspectedCause}. ` +
      'Confirm scope, reproduce with a controlled account, attach trace evidence, and update support with ETA/risk.',
    customerReply:
      'Thanks for reporting this. We have enough detail to begin engineering triage and are checking the affected workflow now. ' +
      'We will share an update once we confirm the cause and mitigation path.',
    rcaDraft: [
      `Incident/issue summary: ${summary}`,
      `Customer impact: ${impact}`,
      `Suspected root cause: ${suspectedCause}`,
      'Mitigation: reproduce, isolate recent changes, add logs/traces, apply rollback or targeted fix if confirmed.',
      'Prevention: add regression coverage, monitoring alert, and runbook entry for this workflow.'
    ]
  };
}

function toMarkdown(report) {
  return `# ${report.title}

**Type:** ${report.template}
**Severity:** ${report.severity}
**Priority:** ${report.priority}
**Area:** ${report.area}
**Confidence:** ${report.confidence}

## Summary
${report.summary}

## Impact
${report.impact}

## Expected vs Actual
- Expected: ${report.expectedActual.expected}
- Actual: ${report.expectedActual.actual}

## Reproduction Steps
${report.reproductionSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

## Evidence
${report.evidence.map((item) => `- ${item}`).join('\n')}

## Evidence Quality
${report.qualitySignals.map((item) => `- ${item.found ? '[x]' : '[ ]'} ${item.label}`).join('\n')}

## Missing Information
${report.missingInfo.map((item) => `- ${item}`).join('\n')}

## Developer Handoff
${report.developerHandoff}

## Customer Reply
${report.customerReply}

## RCA Draft
${report.rcaDraft.map((item) => `- ${item}`).join('\n')}
`;
}

function toIssueFormat(report, format) {
  const label = format === 'github' ? 'GitHub Issue' : format === 'jira' ? 'Jira Ticket' : 'Linear Issue';
  return `${label}: ${report.title}

Priority: ${report.priority}
Severity: ${report.severity}
Confidence: ${report.confidence}
Labels: ${report.area.toLowerCase().replaceAll(' ', '-')}, triage-needed

Description:
${report.summary}

Acceptance criteria:
- Engineering can reproduce or explain why reproduction is blocked.
- Root cause or strongest hypothesis is documented.
- Support has a customer-safe update.
- Prevention task is created if this is a recurring class of issue.
- Any AI-generated assumptions are verified before customer or maintainer submission.

Developer note:
${report.developerHandoff}`;
}

function useLocalLeads() {
  const [leads, setLeads] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bugpilot-leads') || '[]');
    } catch {
      return [];
    }
  });

  function addLead(lead) {
    const next = [{ ...lead, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...leads];
    setLeads(next);
    localStorage.setItem('bugpilot-leads', JSON.stringify(next));
  }

  return { leads, addLead };
}

function Header() {
  return (
    <header className="topbar">
      <a className="brand" href="#hero" aria-label="BugPilot AI home">
        <span className="brand-mark"><Wand2 size={18} /></span>
        <span>BugPilot AI</span>
      </a>
      <nav className="nav">
        <a href="#demo">Demo</a>
        <a href="#product">Product</a>
        <a href="#pricing">Pricing</a>
        <a href="#validation">Validation</a>
      </nav>
      <a className="top-cta" href="#demo">
        Try demo <ArrowRight size={16} />
      </a>
    </header>
  );
}

function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Engineering ops AI for small SaaS teams</p>
        <h1>Turn messy support escalations into engineer-ready bug reports.</h1>
        <p className="hero-subtitle">
          BugPilot AI converts tickets, logs, Slack notes, and incident fragments into reproduction steps,
          RCA drafts, missing-info checklists, developer handoffs, and customer replies.
        </p>
        <div className="hero-actions">
          <a className="primary-btn" href="#demo">
            Generate a report <Sparkles size={18} />
          </a>
          <a className="secondary-btn" href="#validation">
            View go-to-market assets <BookOpenText size={18} />
          </a>
        </div>
        <div className="metrics">
          <div><strong>5 min</strong><span>demo-ready workflow</span></div>
          <div><strong>$49-$99</strong><span>early SaaS pricing</span></div>
          <div><strong>₹40k/mo</strong><span>first revenue target</span></div>
        </div>
      </div>
      <div className="hero-panel" aria-label="BugPilot sample output">
        <div className="panel-top">
          <span className="status-dot"></span>
          <span>Generated handoff</span>
        </div>
        <div className="ticket-preview">
          <span className="tag critical">P1</span>
          <h2>Billing and payments: checkout fails for annual plan</h2>
          <p>Suspected gateway migration issue. Missing Stripe token on POST /api/billing/charge.</p>
          <ul>
            <li>Reproduce annual plan checkout in Chrome.</li>
            <li>Attach request ID, 500 response, and gateway payload.</li>
            <li>Customer-safe reply generated for support.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function DemoWorkspace() {
  const [input, setInput] = useState(defaultInput);
  const [template, setTemplate] = useState('Bug report');
  const [severity, setSeverity] = useState('High');
  const [format, setFormat] = useState('markdown');
  const report = useMemo(() => generateReport({ input, template, severity }), [input, template, severity]);
  const exportText = format === 'markdown' ? toMarkdown(report) : toIssueFormat(report, format);

  async function copyExport() {
    await navigator.clipboard.writeText(exportText);
  }

  function downloadMarkdown() {
    const blob = new Blob([exportText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'bugpilot-report.md';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section id="demo" className="section">
      <div className="section-heading">
        <p className="eyebrow">Live proof product</p>
        <h2>Paste chaos. Ship a clean engineering handoff.</h2>
        <p>Use the fake examples or write your own messy ticket. No confidential employer data should be pasted here.</p>
      </div>

      <div className="demo-grid">
        <div className="input-pane">
          <div className="pane-header">
            <h3>Incident input</h3>
            <span>Fake/sample data only</span>
          </div>
          <div className="sample-row">
            {examples.map((example) => (
              <button
                key={example.id}
                className="chip"
                type="button"
                onClick={() => {
                  setInput(example.input);
                  setTemplate(example.type);
                  setSeverity(example.severity);
                }}
              >
                {example.title}
              </button>
            ))}
          </div>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            aria-label="Messy incident or support ticket"
          />
          <div className="controls">
            <label>
              Template
              <select value={template} onChange={(event) => setTemplate(event.target.value)}>
                {templates.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Severity
              <select value={severity} onChange={(event) => setSeverity(event.target.value)}>
                {severities.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Export
              <select value={format} onChange={(event) => setFormat(event.target.value)}>
                <option value="markdown">Markdown</option>
                <option value="github">GitHub Issue</option>
                <option value="jira">Jira Ticket</option>
                <option value="linear">Linear Issue</option>
              </select>
            </label>
          </div>
        </div>

        <div className="output-pane">
          <div className="pane-header">
            <h3>Generated report</h3>
            <div className="actions">
              <button type="button" onClick={copyExport}><Copy size={16} /> Copy</button>
              <button type="button" onClick={downloadMarkdown}><FileText size={16} /> Export</button>
            </div>
          </div>
          <div className="report-card">
            <div className="report-title-row">
              <span className={`tag ${report.severity.toLowerCase()}`}>{report.priority}</span>
              <h3>{report.title}</h3>
            </div>
            <dl className="report-meta">
              <div><dt>Type</dt><dd>{report.template}</dd></div>
              <div><dt>Severity</dt><dd>{report.severity}</dd></div>
              <div><dt>Confidence</dt><dd>{report.confidence}</dd></div>
            </dl>
            <div className={`trust-banner ${report.confidence.toLowerCase()}`}>
              <ShieldCheck size={18} />
              <span>
                {report.confidence === 'High'
                  ? 'Strong handoff: customer impact, evidence, timeline, and suspected change are present.'
                  : report.confidence === 'Medium'
                    ? 'Usable draft: verify missing context before filing this with engineering.'
                    : 'Needs review: this input lacks enough evidence for a reliable bug report.'}
              </span>
            </div>
            <ReportSection title="Summary" content={report.summary} />
            <QualitySignals signals={report.qualitySignals} />
            <ReportSection title="Reproduction steps" items={report.reproductionSteps} />
            <ReportSection title="Missing information" items={report.missingInfo} />
            <ReportSection title="Developer handoff" content={report.developerHandoff} />
            <ReportSection title="Customer reply" content={report.customerReply} />
          </div>
        </div>
      </div>
    </section>
  );
}

function QualitySignals({ signals }) {
  return (
    <section className="quality-grid" aria-label="Evidence quality signals">
      {signals.map((signal) => (
        <div className={signal.found ? 'quality-item found' : 'quality-item'} key={signal.label}>
          <Check size={15} />
          <span>{signal.label}</span>
        </div>
      ))}
    </section>
  );
}

function ReportSection({ title, content, items }) {
  return (
    <section className="report-section">
      <h4>{title}</h4>
      {content && <p>{content}</p>}
      {items && <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>}
    </section>
  );
}

function ProductSection() {
  const features = [
    ['Bug triage', 'Clean title, priority, area, reproduction steps, and missing-info checklist.'],
    ['Incident RCA', 'Impact, suspected cause, mitigation, prevention actions, and customer-safe updates.'],
    ['Export formats', 'Markdown today, GitHub/Jira/Linear handoff language for early customer demos.'],
    ['Company brain path', 'Later: learn from old bugs, incidents, runbooks, and release notes.']
  ];
  return (
    <section id="product" className="section tinted">
      <div className="section-heading">
        <p className="eyebrow">Product wedge</p>
        <h2>Start with support-to-engineering handoff. Expand into engineering memory.</h2>
      </div>
      <div className="feature-grid">
        {features.map(([title, body]) => (
          <article className="feature-card" key={title}>
            <div className="icon-box"><Check size={18} /></div>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PricingSection() {
  const tiers = [
    ['Starter', '$19/mo', 'Solo founders and early SaaS teams validating bug triage automation.'],
    ['Startup', '$49/mo', 'Small teams handling recurring customer escalations.'],
    ['Pro', '$99/mo', 'Support-heavy SaaS teams needing custom templates and review support.']
  ];
  return (
    <section id="pricing" className="section">
      <div className="section-heading">
        <p className="eyebrow">Pricing hypothesis</p>
        <h2>Designed to reach ₹40k/month with 5-10 customers.</h2>
      </div>
      <div className="pricing-grid">
        {tiers.map(([name, price, description]) => (
          <article className="price-card" key={name}>
            <h3>{name}</h3>
            <strong>{price}</strong>
            <p>{description}</p>
            <button type="button">Use for beta pitch</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ValidationSection({ leads, addLead }) {
  const [form, setForm] = useState({ name: '', email: '', company: '', role: 'Founder/CEO', pain: '' });

  function submit(event) {
    event.preventDefault();
    if (!form.name || !form.email) return;
    addLead(form);
    setForm({ name: '', email: '', company: '', role: 'Founder/CEO', pain: '' });
  }

  const outreach =
    'Hi [Name], I’m building BugPilot AI for small software teams. It turns messy support tickets, logs, and Slack/Jira notes into clean engineer-ready bug reports, reproduction steps, RCA drafts, and customer replies. Curious: does your team lose time converting customer issues into actionable dev tickets?';

  return (
    <section id="validation" className="section validation">
      <div className="section-heading">
        <p className="eyebrow">Validation cockpit</p>
        <h2>Use this page to sell before overbuilding.</h2>
        <p>Track early leads in localStorage and reuse the outreach copy for async discovery.</p>
      </div>
      <div className="validation-grid">
        <form className="lead-form" onSubmit={submit}>
          <h3>Waitlist / beta lead</h3>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option>Founder/CEO</option>
            <option>Engineering manager</option>
            <option>Support lead</option>
            <option>Developer</option>
          </select>
          <textarea placeholder="What support-to-engineering pain do they have?" value={form.pain} onChange={(e) => setForm({ ...form, pain: e.target.value })} />
          <button className="primary-btn" type="submit">Save lead <ArrowRight size={17} /></button>
        </form>

        <div className="asset-card">
          <h3>Outbound message</h3>
          <p>{outreach}</p>
          <button type="button" onClick={() => navigator.clipboard.writeText(outreach)}>
            <Clipboard size={16} /> Copy script
          </button>
        </div>

        <div className="lead-list">
          <h3>Local beta pipeline</h3>
          {leads.length === 0 ? (
            <p className="empty">No leads saved yet. Add prospects after outreach replies.</p>
          ) : (
            leads.map((lead) => (
              <div className="lead-item" key={lead.id}>
                <strong>{lead.name}</strong>
                <span>{lead.role} · {lead.company || 'No company'}</span>
                <p>{lead.pain || 'Pain not captured yet.'}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  const steps = [
    ['Day 7', 'Landing page, fake demos, first 20 outbound messages.'],
    ['Day 30', '30 contacted, 10 useful replies, 3 demo users, 1 payment signal.'],
    ['Day 60', 'Private beta live with saved reports and exports.'],
    ['Month 6', '5-10 customers at $49-$99/month.']
  ];
  return (
    <section className="roadmap">
      <div className="roadmap-inner">
        <div>
          <p className="eyebrow">Execution path</p>
          <h2>Build only what revenue proves.</h2>
        </div>
        <div className="timeline">
          {steps.map(([time, text]) => (
            <div className="timeline-item" key={time}>
              <strong>{time}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div>
        <strong>BugPilot AI</strong>
        <p>Proof product for engineering ops AI SaaS validation.</p>
      </div>
      <div className="footer-links">
        <span><ShieldCheck size={16} /> No confidential data</span>
        <span><Github size={16} /> GitHub export ready</span>
        <span><Mail size={16} /> Async-first sales</span>
      </div>
    </footer>
  );
}

function App() {
  const { leads, addLead } = useLocalLeads();
  return (
    <>
      <Header />
      <main>
        <Hero />
        <div className="proof-strip" aria-label="Product proof points">
          <span><LayoutDashboard size={17} /> Live demo</span>
          <span><MessageSquareText size={17} /> Customer reply</span>
          <span><Target size={17} /> Bug triage</span>
          <span><Timer size={17} /> RCA draft</span>
          <span><BadgeDollarSign size={17} /> Revenue target</span>
        </div>
        <DemoWorkspace />
        <ProductSection />
        <PricingSection />
        <Roadmap />
        <ValidationSection leads={leads} addLead={addLead} />
      </main>
      <Footer />
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
