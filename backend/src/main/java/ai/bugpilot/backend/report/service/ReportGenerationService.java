package ai.bugpilot.backend.report.service;

import ai.bugpilot.backend.report.dto.GenerateReportRequest;
import ai.bugpilot.backend.report.dto.QualitySignalResponse;
import ai.bugpilot.backend.report.dto.ReportResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class ReportGenerationService {

    private static final Pattern SENTENCE_SPLIT = Pattern.compile("(?<=[.!?])\\s+");

    public ReportResponse generate(GenerateReportRequest request) {
        String input = normalize(request.input());
        List<String> sentences = splitSentences(input);
        String area = inferArea(input);
        String severity = inferSeverity(input, request.severity());
        String priority = priorityFor(severity);
        String summary = clean(firstOrDefault(sentences, "A customer-facing issue was reported and needs engineering triage."));
        String impact = clean(findFirst(sentences, "(?i).*\\b(affected|customer|users|enterprise|checkout|dashboard|login|client)\\b.*", summary));
        String suspectedCause = clean(findSuspectedCause(sentences));
        List<String> evidence = extractEvidence(sentences);
        List<QualitySignalResponse> qualitySignals = qualitySignals(input);
        String confidence = confidence(qualitySignals);

        List<String> reproductionSteps = List.of(
                "Open the affected " + area.toLowerCase(Locale.ROOT) + " workflow in a test or staging account.",
                "Repeat the user action described in the ticket using the same plan, browser, configuration, or account type where available.",
                "Capture the visible error, network request, response code, backend trace, and any relevant third-party response.",
                "Compare against an unaffected account or plan to isolate configuration versus code behavior."
        );

        List<String> missingInfo = List.of(
                "Exact affected user/account IDs or anonymized reproducible test account",
                "First known occurrence timestamp and whether the issue is still active",
                "Relevant request IDs, trace IDs, logs, or screenshots",
                "Expected behavior confirmed by product/support owner",
                "Recent deployments, configuration changes, or third-party incidents"
        );

        String developerHandoff = "Please triage " + area.toLowerCase(Locale.ROOT) + " as " + severity
                + " severity. Start by validating the suspected change: " + suspectedCause
                + ". Confirm scope, reproduce with a controlled account, attach trace evidence, and update support with ETA/risk.";

        String customerReply = "Thanks for reporting this. We have enough detail to begin engineering triage and are checking the affected workflow now. "
                + "We will share an update once we confirm the cause and mitigation path.";

        List<String> rcaDraft = List.of(
                "Incident/issue summary: " + summary,
                "Customer impact: " + impact,
                "Suspected root cause: " + suspectedCause,
                "Mitigation: reproduce, isolate recent changes, add logs/traces, apply rollback or targeted fix if confirmed.",
                "Prevention: add regression coverage, monitoring alert, and runbook entry for this workflow."
        );

        return new ReportResponse(
                area + ": " + summary,
                safeDefault(request.template(), "Bug report"),
                severity,
                priority,
                area,
                confidence,
                summary,
                impact,
                suspectedCause,
                new ReportResponse.ExpectedActualResponse(
                        "The user should complete the workflow without errors, redirects, or excessive latency.",
                        summary
                ),
                reproductionSteps,
                evidence,
                qualitySignals,
                missingInfo,
                developerHandoff,
                customerReply,
                rcaDraft
        );
    }

    private static String normalize(String value) {
        return value == null ? "" : value.replaceAll("\\s+", " ").trim();
    }

    private static List<String> splitSentences(String input) {
        return Arrays.stream(SENTENCE_SPLIT.split(input))
                .map(String::trim)
                .filter(sentence -> !sentence.isBlank())
                .toList();
    }

    private static String firstOrDefault(List<String> values, String fallback) {
        return values.isEmpty() ? fallback : values.get(0);
    }

    private static String clean(String sentence) {
        return sentence.replaceAll("\\s+", " ").replaceAll("[.?!]+$", "").trim();
    }

    private static String safeDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private static String inferArea(String input) {
        String lowered = input.toLowerCase(Locale.ROOT);
        if (containsAny(lowered, "payment", "billing", "stripe")) {
            return "Billing and payments";
        }
        if (containsAny(lowered, "login", "sso", "saml", "okta")) {
            return "Authentication";
        }
        if (containsAny(lowered, "api", "latency", "timeout")) {
            return "API performance";
        }
        if (containsAny(lowered, "database", "db")) {
            return "Database";
        }
        return "Application workflow";
    }

    private static String inferSeverity(String input, String fallback) {
        String lowered = input.toLowerCase(Locale.ROOT);
        if (containsAny(lowered, "outage", "critical", "down", "500")) {
            return "Critical";
        }
        if (containsAny(lowered, "payment", "enterprise", "blocked")) {
            return "High";
        }
        if (containsAny(lowered, "cannot", "error", "failed")) {
            return "Medium";
        }
        return safeDefault(fallback, "Medium");
    }

    private static String priorityFor(String severity) {
        return switch (severity) {
            case "Critical" -> "P0";
            case "High" -> "P1";
            case "Medium" -> "P2";
            default -> "P3";
        };
    }

    private static String findFirst(List<String> sentences, String regex, String fallback) {
        return sentences.stream()
                .filter(sentence -> sentence.matches(regex))
                .findFirst()
                .orElse(fallback);
    }

    private static String findSuspectedCause(List<String> sentences) {
        return sentences.stream()
                .filter(sentence -> sentence.matches("(?i).*\\b(migration|deployment|changed|added|metadata|rollback|configuration|release)\\b.*"))
                .findFirst()
                .or(() -> sentences.stream().filter(sentence -> sentence.matches("(?i).*\\b(started after|began after|since)\\b.*")).findFirst())
                .orElse("Root cause is not confirmed yet. Engineering should validate recent changes, logs, and affected workflow.");
    }

    private static List<String> extractEvidence(List<String> sentences) {
        List<String> evidence = sentences.stream()
                .filter(sentence -> sentence.matches("(?i).*\\b(log|error|500|latency|cpu|token|audience|redirect|browser|api|db|trace)\\b.*"))
                .map(ReportGenerationService::clean)
                .toList();
        return evidence.isEmpty()
                ? List.of("No structured logs or traces were included in the original note.")
                : evidence;
    }

    private static List<QualitySignalResponse> qualitySignals(String input) {
        String lowered = input.toLowerCase(Locale.ROOT);
        List<QualitySignalResponse> signals = new ArrayList<>();
        signals.add(new QualitySignalResponse("Customer impact", containsAny(lowered, "customer", "user", "affected", "account", "enterprise", "client")));
        signals.add(new QualitySignalResponse("Technical evidence", containsAny(lowered, "log", "trace", "request", "500", "latency", "cpu", "token", "api", "db", "saml", "error")));
        signals.add(new QualitySignalResponse("Timeline", containsAny(lowered, "today", "yesterday", "morning", "started", "from", "after") || lowered.matches(".*\\d{1,2}:\\d{2}.*")));
        signals.add(new QualitySignalResponse("Suspected change", containsAny(lowered, "deployment", "migration", "changed", "release", "rollback", "configuration", "metadata", "added")));
        return signals;
    }

    private static String confidence(List<QualitySignalResponse> signals) {
        long count = signals.stream().filter(QualitySignalResponse::found).count();
        if (count >= 4) {
            return "High";
        }
        if (count == 3) {
            return "Medium";
        }
        return "Low";
    }

    private static boolean containsAny(String text, String... needles) {
        return Arrays.stream(needles).anyMatch(text::contains);
    }
}
