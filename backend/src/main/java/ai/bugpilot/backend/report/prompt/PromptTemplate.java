package ai.bugpilot.backend.report.prompt;

public record PromptTemplate(
        String key,
        String label,
        String systemInstruction,
        String outputContract
) {
}
