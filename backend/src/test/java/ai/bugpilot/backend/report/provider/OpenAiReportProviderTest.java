package ai.bugpilot.backend.report.provider;

import ai.bugpilot.backend.report.dto.GenerateReportRequest;
import ai.bugpilot.backend.report.dto.ReportResponse;
import ai.bugpilot.backend.report.prompt.PromptTemplate;
import ai.bugpilot.backend.shared.config.AiProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class OpenAiReportProviderTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void generateSendsServerSideKeyAndParsesStructuredOutput() throws Exception {
        AiProperties aiProperties = new AiProperties();
        aiProperties.setProvider("openai");
        aiProperties.getOpenai().setApiKey("test-api-key");
        aiProperties.getOpenai().setModel("gpt-5.4-mini");
        aiProperties.getOpenai().setBaseUrl("https://api.openai.test/v1");

        RestClient.Builder restClientBuilder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restClientBuilder).build();
        OpenAiReportProvider provider = new OpenAiReportProvider(aiProperties, objectMapper, restClientBuilder);

        server.expect(requestTo("https://api.openai.test/v1/responses"))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer test-api-key"))
                .andExpect(jsonPath("$.model").value("gpt-5.4-mini"))
                .andExpect(jsonPath("$.store").value(false))
                .andRespond(withSuccess(openAiResponse(), MediaType.APPLICATION_JSON));

        ReportResponse report = provider.generate(
                new GenerateReportRequest(
                        "Customer cannot complete checkout after the billing migration. Logs show POST /api/billing/charge 500.",
                        "Bug report",
                        "High",
                        "github"
                ),
                new PromptTemplate(
                        "bug-report",
                        "Bug report",
                        "Create a clear developer ticket.",
                        "Return BugPilot report JSON."
                )
        );

        assertThat(report.title()).isEqualTo("Billing and payments: checkout fails");
        assertThat(report.priority()).isEqualTo("P1");
        assertThat(report.qualitySignals()).hasSize(4);
        server.verify();
    }

    private String openAiResponse() throws Exception {
        String reportJson = objectMapper.writeValueAsString(new ReportResponse(
                "Billing and payments: checkout fails",
                "Bug report",
                "High",
                "P1",
                "Billing and payments",
                "High",
                "Checkout fails after billing migration",
                "Annual checkout is blocked for at least one customer",
                "Recent billing migration should be checked first",
                new ReportResponse.ExpectedActualResponse(
                        "Customer should complete checkout",
                        "Checkout returns an error"
                ),
                java.util.List.of("Open checkout", "Select annual plan", "Submit payment", "Capture request and response"),
                java.util.List.of("POST /api/billing/charge returned 500"),
                java.util.List.of(
                        new ai.bugpilot.backend.report.dto.QualitySignalResponse("Customer impact", true),
                        new ai.bugpilot.backend.report.dto.QualitySignalResponse("Technical proof", true),
                        new ai.bugpilot.backend.report.dto.QualitySignalResponse("Timeline", false),
                        new ai.bugpilot.backend.report.dto.QualitySignalResponse("Likely change", true)
                ),
                java.util.List.of("Affected account id", "Exact first occurrence"),
                "Check billing migration, reproduce checkout, and attach request traces.",
                "Thanks for reporting this. We are checking the checkout path and will update you once confirmed.",
                java.util.List.of("Issue summary: checkout fails", "Prevention: add billing regression test")
        ));
        return objectMapper.writeValueAsString(java.util.Map.of("output_text", reportJson));
    }
}
