package ai.bugpilot.backend.report.dto;

import java.util.List;

public record ReportResponse(
        String title,
        String template,
        String severity,
        String priority,
        String area,
        String confidence,
        String summary,
        String impact,
        String suspectedCause,
        ExpectedActualResponse expectedActual,
        List<String> reproductionSteps,
        List<String> evidence,
        List<QualitySignalResponse> qualitySignals,
        List<String> missingInfo,
        String developerHandoff,
        String customerReply,
        List<String> rcaDraft
) {
    public record ExpectedActualResponse(String expected, String actual) {
    }
}
