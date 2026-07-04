package ai.bugpilot.backend.report.dto;

public record QualitySignalResponse(
        String label,
        boolean found
) {
}
