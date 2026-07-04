package ai.bugpilot.backend.shared.rate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "bugpilot.rate-limit.requests-per-minute=1")
class RateLimitFilterTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void rejectsRequestsAboveConfiguredLimit() throws Exception {
        String request = """
                {
                  "input": "Customer ACME says checkout fails after a payment gateway migration. Logs show POST /api/billing/charge 500.",
                  "template": "Bug report",
                  "severity": "High"
                }
                """;

        mockMvc.perform(post("/api/reports/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/reports/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value("Too many requests. Please wait and try again."));
    }
}
