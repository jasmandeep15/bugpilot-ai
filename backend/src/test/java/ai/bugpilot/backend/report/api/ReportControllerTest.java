package ai.bugpilot.backend.report.api;

import ai.bugpilot.backend.report.persistence.ReportRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ReportRecordRepository reportRecordRepository;

    @BeforeEach
    void cleanReports() {
        reportRecordRepository.deleteAll();
    }

    @Test
    void generateReportReturnsEngineerReadyReport() throws Exception {
        String request = """
                {
                  "input": "Customer ACME says checkout fails for annual plan. Started after yesterday payment gateway migration. Logs show POST /api/billing/charge 500 and Stripe token missing.",
                  "template": "Bug report",
                  "severity": "High",
                  "exportFormat": "github"
                }
                """;

        mockMvc.perform(post("/api/reports/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.area").value("Billing and payments"))
                .andExpect(jsonPath("$.priority").value("P0"))
                .andExpect(jsonPath("$.confidence").value("High"))
                .andExpect(jsonPath("$.developerHandoff", containsString("payment gateway migration")))
                .andExpect(jsonPath("$.reproductionSteps", hasSize(4)))
                .andExpect(jsonPath("$.qualitySignals", hasSize(4)))
                .andExpect(header().exists("X-Request-Id"));

        mockMvc.perform(get("/api/reports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].area").value("Billing and payments"))
                .andExpect(jsonPath("$[0].priority").value("P0"));
    }

    @Test
    void generateReportRejectsShortInput() throws Exception {
        String request = """
                {
                  "input": "too short",
                  "template": "Bug report",
                  "severity": "Medium"
                }
                """;

        mockMvc.perform(post("/api/reports/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Request validation failed"))
                .andExpect(jsonPath("$.fieldErrors.input").exists());
    }

    @Test
    void savedReportReturnsNotFoundForUnknownId() throws Exception {
        mockMvc.perform(get("/api/reports/11111111-1111-1111-1111-111111111111"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Report not found"));
    }
}
