package ai.bugpilot.backend.report.provider;

import ai.bugpilot.backend.report.dto.GenerateReportRequest;
import ai.bugpilot.backend.report.dto.ReportResponse;
import ai.bugpilot.backend.report.prompt.PromptTemplate;
import ai.bugpilot.backend.shared.config.AiProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Component
public class OpenAiReportProvider implements ReportProvider {

    private final AiProperties aiProperties;
    private final ObjectMapper objectMapper;
    private final RestClient.Builder restClientBuilder;

    public OpenAiReportProvider(AiProperties aiProperties, ObjectMapper objectMapper, RestClient.Builder restClientBuilder) {
        this.aiProperties = aiProperties;
        this.objectMapper = objectMapper;
        this.restClientBuilder = restClientBuilder;
    }

    @Override
    public ReportResponse generate(GenerateReportRequest request, PromptTemplate promptTemplate) {
        AiProperties.OpenAi openai = aiProperties.getOpenai();
        JsonNode response = restClientBuilder.clone()
                .baseUrl(openai.getBaseUrl())
                .defaultHeader("Authorization", "Bearer " + openai.getApiKey())
                .defaultHeader("Content-Type", "application/json")
                .build()
                .post()
                .uri("/responses")
                .body(requestBody(request, promptTemplate, openai.getModel()))
                .retrieve()
                .body(JsonNode.class);

        String outputText = extractOutputText(response);
        try {
            return objectMapper.readValue(stripJsonFence(outputText), ReportResponse.class);
        } catch (Exception exception) {
            throw new IllegalStateException("OpenAI returned a response that did not match BugPilot's report contract", exception);
        }
    }

    private Map<String, Object> requestBody(GenerateReportRequest request, PromptTemplate promptTemplate, String model) {
        return Map.of(
                "model", model,
                "store", false,
                "reasoning", Map.of("effort", "low"),
                "text", Map.of(
                        "verbosity", "low",
                        "format", Map.of(
                                "type", "json_schema",
                                "name", "bugpilot_report",
                                "strict", true,
                                "schema", reportSchema()
                        )
                ),
                "input", List.of(
                        Map.of(
                                "role", "system",
                                "content", """
                                        You are BugPilot AI. Convert rough customer issue notes into a clear developer-ready ticket.
                                        Use plain language. Do not invent facts. Put uncertain points in missingInfo.
                                        Keep customerReply safe, calm, and non-committal. Never include secrets.
                                        """
                        ),
                        Map.of(
                                "role", "user",
                                "content", """
                                        Template: %s
                                        Template instruction: %s
                                        Output contract: %s
                                        User selected severity: %s
                                        Export target: %s

                                        Raw issue notes:
                                        %s
                                        """.formatted(
                                        promptTemplate.label(),
                                        promptTemplate.systemInstruction(),
                                        promptTemplate.outputContract(),
                                        request.severity(),
                                        request.exportFormat() == null ? "markdown" : request.exportFormat(),
                                        request.input()
                                )
                        )
                )
        );
    }

    private Map<String, Object> reportSchema() {
        Map<String, Object> stringSchema = Map.of("type", "string");
        Map<String, Object> stringArray = Map.of("type", "array", "items", stringSchema);

        return Map.of(
                "type", "object",
                "additionalProperties", false,
                "required", List.of(
                        "title", "template", "severity", "priority", "area", "confidence", "summary", "impact",
                        "suspectedCause", "expectedActual", "reproductionSteps", "evidence", "qualitySignals",
                        "missingInfo", "developerHandoff", "customerReply", "rcaDraft"
                ),
                "properties", Map.ofEntries(
                        Map.entry("title", stringSchema),
                        Map.entry("template", stringSchema),
                        Map.entry("severity", Map.of("type", "string", "enum", List.of("Low", "Medium", "High", "Critical"))),
                        Map.entry("priority", Map.of("type", "string", "enum", List.of("P0", "P1", "P2", "P3"))),
                        Map.entry("area", stringSchema),
                        Map.entry("confidence", Map.of("type", "string", "enum", List.of("Low", "Medium", "High"))),
                        Map.entry("summary", stringSchema),
                        Map.entry("impact", stringSchema),
                        Map.entry("suspectedCause", stringSchema),
                        Map.entry("expectedActual", Map.of(
                                "type", "object",
                                "additionalProperties", false,
                                "required", List.of("expected", "actual"),
                                "properties", Map.of("expected", stringSchema, "actual", stringSchema)
                        )),
                        Map.entry("reproductionSteps", stringArray),
                        Map.entry("evidence", stringArray),
                        Map.entry("qualitySignals", Map.of(
                                "type", "array",
                                "items", Map.of(
                                        "type", "object",
                                        "additionalProperties", false,
                                        "required", List.of("label", "found"),
                                        "properties", Map.of(
                                                "label", stringSchema,
                                                "found", Map.of("type", "boolean")
                                        )
                                )
                        )),
                        Map.entry("missingInfo", stringArray),
                        Map.entry("developerHandoff", stringSchema),
                        Map.entry("customerReply", stringSchema),
                        Map.entry("rcaDraft", stringArray)
                )
        );
    }

    private String extractOutputText(JsonNode response) {
        if (response == null) {
            throw new IllegalStateException("OpenAI returned an empty response");
        }
        JsonNode outputText = response.path("output_text");
        if (outputText.isTextual()) {
            return outputText.asText();
        }
        for (JsonNode outputItem : response.path("output")) {
            for (JsonNode contentItem : outputItem.path("content")) {
                if ("output_text".equals(contentItem.path("type").asText()) && contentItem.path("text").isTextual()) {
                    return contentItem.path("text").asText();
                }
            }
        }
        throw new IllegalStateException("OpenAI response did not include output text");
    }

    private String stripJsonFence(String text) {
        String trimmed = text == null ? "" : text.trim();
        if (trimmed.startsWith("```json") && trimmed.endsWith("```")) {
            return trimmed.substring(7, trimmed.length() - 3).trim();
        }
        if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
            return trimmed.substring(3, trimmed.length() - 3).trim();
        }
        return trimmed;
    }
}
