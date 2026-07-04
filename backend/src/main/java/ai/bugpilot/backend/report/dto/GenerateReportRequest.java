package ai.bugpilot.backend.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GenerateReportRequest(
        @NotBlank(message = "input is required")
        @Size(min = 20, max = 8_000, message = "input must be between 20 and 8000 characters")
        String input,

        @NotBlank(message = "template is required")
        @Size(max = 60, message = "template must be at most 60 characters")
        String template,

        @NotBlank(message = "severity is required")
        @Size(max = 30, message = "severity must be at most 30 characters")
        String severity,

        @Size(max = 30, message = "exportFormat must be at most 30 characters")
        String exportFormat
) {
}
