package ai.bugpilot.backend.report.prompt;

import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class PromptTemplateCatalog {

    private static final PromptTemplate DEFAULT_TEMPLATE = new PromptTemplate(
            "bug-report",
            "Bug report",
            "Convert a rough customer issue into a clear developer ticket. Avoid guessing. Call out missing proof.",
            "Return title, priority, impact, likely area, reproduction steps, missing information, developer note, and customer-safe reply."
    );

    private final Map<String, PromptTemplate> templates = Map.of(
            "Bug report", DEFAULT_TEMPLATE,
            "Incident summary", new PromptTemplate(
                    "incident-summary",
                    "Incident summary",
                    "Summarize an active or recent customer-impacting issue for a software team. Avoid blame.",
                    "Return impact, timeline, suspected cause, mitigation, next update, prevention tasks, and customer-safe reply."
            ),
            "Support escalation", new PromptTemplate(
                    "support-escalation",
                    "Support escalation",
                    "Turn support notes into a developer-ready escalation with the exact follow-up questions still needed.",
                    "Return issue summary, customer impact, evidence, missing information, developer note, and customer reply."
            ),
            "Regression report", new PromptTemplate(
                    "regression-report",
                    "Regression report",
                    "Clarify whether a customer issue looks like a regression and what changed recently.",
                    "Return previous behavior, current behavior, suspected change, reproduction steps, risk, and rollback/fix checks."
            ),
            "Release blocker", new PromptTemplate(
                    "release-blocker",
                    "Release blocker",
                    "Turn release-blocking notes into a concise decision-ready summary.",
                    "Return blocker summary, affected release, risk, required proof, owner questions, and go/no-go recommendation."
            )
    );

    public PromptTemplate find(String template) {
        return templates.getOrDefault(template, DEFAULT_TEMPLATE);
    }
}
