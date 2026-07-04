import React, { useEffect, useMemo, useState } from 'react';
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
    type: 'Incident summary',
    severity: 'Critical',
    input:
      'From 10:05 to 10:42 UTC, customers reported dashboard loading forever. p95 latency on /api/reports jumped to 18s. DB CPU 95%. Recent deployment added joins for account usage summary. Rollback at 10:38 improved latency. 18 enterprise accounts affected. Need incident summary and customer note.'
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

const templates = ['Bug report', 'Incident summary', 'Support escalation', 'Regression report', 'Release blocker'];
const severities = ['Low', 'Medium', 'High', 'Critical'];

const defaultInput = examples[0].input;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080';

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

## Reply draft
${report.customerReply}

## Incident summary
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
        <p className="eyebrow">For software teams that support real customers</p>
        <h1>Turn messy customer issues into clear developer tickets.</h1>
        <p className="hero-subtitle">
          BugPilot AI turns support notes, logs, screenshots, and chat threads into clean bug reports,
          next questions, developer notes, and customer-safe replies.
        </p>
        <div className="hero-actions">
          <a className="primary-btn" href="#demo">
            Generate a ticket <Sparkles size={18} />
          </a>
          <a className="secondary-btn" href="#validation">
            View sales assets <BookOpenText size={18} />
          </a>
        </div>
        <div className="metrics">
          <div><strong>5 min</strong><span>demo-ready workflow</span></div>
          <div><strong>\$5/user</strong><span>starting beta price</span></div>
          <div><strong>Rs 40k/mo</strong><span>first revenue target</span></div>
        </div>
      </div>
      <div className="hero-panel" aria-label="BugPilot sample output">
        <div className="panel-top">
          <span className="status-dot"></span>
          <span>Ready for review</span>
        </div>
        <div className="ticket-preview">
          <span className="tag critical">P1</span>
          <h2>Checkout fails for annual plan</h2>
          <p>Clear cause to check, exact proof to attach, and a Reply draft ready for review.</p>
          <ul>
            <li>What the developer should test first.</li>
            <li>What proof is missing before filing.</li>
            <li>What support can safely tell the customer.</li>
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
  const [apiReport, setApiReport] = useState(null);
  const [apiStatus, setApiStatus] = useState('Local generator ready');
  const [recentReports, setRecentReports] = useState([]);
  const localReport = useMemo(() => generateReport({ input, template, severity }), [input, template, severity]);
  const report = apiReport || localReport;
  const exportText = format === 'markdown' ? toMarkdown(report) : toIssueFormat(report, format);

  useEffect(() => {
    loadRecentReports();
  }, []);

  useEffect(() => {
    setApiReport(null);
    setApiStatus('Local generator ready');
  }, [input, template, severity]);

  async function loadRecentReports() {
    try {
      const response = await fetch(`${apiBaseUrl}/api/reports`);
      if (!response.ok) return;
      setRecentReports(await response.json());
    } catch {
      setRecentReports([]);
    }
  }

  async function openSavedReport(id) {
    setApiStatus('Loading saved report...');
    try {
      const response = await fetch(`${apiBaseUrl}/api/reports/${id}`);
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      setApiReport(await response.json());
      setApiStatus('Saved report loaded');
    } catch (error) {
      setApiStatus(`Saved report unavailable: ${error.message}`);
    }
  }

  async function generateWithBackend() {
    setApiStatus('Generating with backend...');
    try {
      const response = await fetch(`${apiBaseUrl}/api/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          template,
          severity,
          exportFormat: format
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || `Backend returned ${response.status}`);
      }

      setApiReport(await response.json());
      setApiStatus('Backend response loaded');
      await loadRecentReports();
    } catch (error) {
      setApiReport(null);
      setApiStatus(`Backend unavailable: ${error.message}. Showing local generator output.`);
    }
  }

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
        <p className="eyebrow">Live product demo</p>
        <h2>Paste a rough issue. Get a clean ticket.</h2>
        <p>Use the sample issues or write your own fake example. Do not paste private company or customer data.</p>
      </div>

      <div className="demo-grid">
        <div className="input-pane">
          <div className="pane-header">
            <h3>Customer issue</h3>
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
            <h3>Ready-to-review ticket</h3>
            <div className="actions">
              <button type="button" onClick={generateWithBackend}><Rocket size={16} /> Generate</button>
              <button type="button" onClick={copyExport}><Copy size={16} /> Copy</button>
              <button type="button" onClick={downloadMarkdown}><FileText size={16} /> Export</button>
            </div>
          </div>
          <div className="api-status">{apiStatus}</div>
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
                  ? 'Strong draft: impact, proof, timing, and likely change are included.'
                  : report.confidence === 'Medium'
                    ? 'Usable draft: review the missing details before sending this to developers.'
                    : 'Needs more detail: this issue is too thin to send without follow-up questions.'}
              </span>
            </div>
            <ReportSection title="Summary" content={report.summary} />
            <QualitySignals signals={report.qualitySignals} />
            <ReportSection title="Reproduction steps" items={report.reproductionSteps} />
            <ReportSection title="Missing information" items={report.missingInfo} />
            <ReportSection title="Developer note" content={report.developerHandoff} />
            <ReportSection title="Reply draft" content={report.customerReply} />
          </div>
          <div className="recent-reports">
            <div className="recent-header">
              <h3>Recent reports</h3>
              <button type="button" onClick={loadRecentReports}>Refresh</button>
            </div>
            {recentReports.length === 0 ? (
              <p>No backend reports saved yet.</p>
            ) : (
              <div className="recent-list">
                {recentReports.map((item) => (
                  <button type="button" key={item.id} onClick={() => openSavedReport(item.id)}>
                    <strong>{item.title}</strong>
                    <span>{item.priority} - {item.area} - {new Date(item.createdAt).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            )}
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
    ['Clear tickets', 'Clean title, priority, affected area, test steps, and missing details.'],
    ['Customer updates', 'A calm reply your support team can review and send faster.'],
    ['Developer exports', 'Copy-ready formats for GitHub, Jira, Linear, and Markdown.'],
    ['Team memory', 'Later: reuse past issues so teams do not solve the same problem twice.']
  ];
  return (
    <section id="product" className="section tinted">
      <div className="section-heading">
        <p className="eyebrow">Why teams buy it</p>
        <h2>Less back-and-forth between support and developers.</h2>
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
    ['Beta seat', '$5/user/mo', 'For early teams. Unlimited drafts during beta, billed only for active teammates.'],
    ['Team pack', '$39/mo', 'Up to 10 teammates. Best for small teams that want one simple monthly price.'],
    ['Founder deal', '$99/mo', 'Unlimited teammates for early customers who give monthly feedback and case-study permission.']
  ];
  return (
    <section id="pricing" className="section">
      <div className="section-heading">
        <p className="eyebrow">Beta pricing</p>
        <h2>Cheaper than one support call going in circles.</h2>
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
    'Hi [Name], I am building BugPilot AI for small software teams. It turns rough customer issues, logs, screenshots, and chat notes into clear developer tickets and customer-safe replies. Curious: does your team lose time going back and forth before a bug is ready for developers?';

  return (
    <section id="validation" className="section validation">
      <div className="section-heading">
        <p className="eyebrow">Sales tracker</p>
        <h2>Track who wants the beta.</h2>
        <p>Save early leads locally and reuse the outreach copy for quick founder conversations.</p>
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
          <textarea placeholder="Where does your team lose time on customer issues?" value={form.pain} onChange={(e) => setForm({ ...form, pain: e.target.value })} />
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
                <span>{lead.role} - {lead.company || 'No company'}</span>
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
    ['Month 6', '10-20 teams using beta pricing with a path to higher plans.']
  ];
  return (
    <section className="roadmap">
      <div className="roadmap-inner">
        <div>
          <p className="eyebrow">Execution path</p>
          <h2>Build only what paying teams ask for twice.</h2>
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
        <p>Customer issue to developer ticket, ready for review.</p>
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
          <span><MessageSquareText size={17} /> Reply draft</span>
          <span><Target size={17} /> Clear tickets</span>
          <span><Timer size={17} /> Faster tickets</span>
          <span><BadgeDollarSign size={17} /> Low beta price</span>
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
