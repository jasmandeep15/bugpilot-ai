package ai.bugpilot.backend.report.dto;

import java.time.Instant;
import java.util.UUID;

public record ReportSummaryResponse(
        UUID id,
        String title,
        String template,
        String severity,
        String priority,
        String area,
        String confidence,
        Instant createdAt
) {
}
