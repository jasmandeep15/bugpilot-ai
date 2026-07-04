package ai.bugpilot.backend.report.api;

import ai.bugpilot.backend.report.dto.GenerateReportRequest;
import ai.bugpilot.backend.report.dto.ReportResponse;
import ai.bugpilot.backend.report.service.ReportGenerationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportGenerationService reportGenerationService;

    public ReportController(ReportGenerationService reportGenerationService) {
        this.reportGenerationService = reportGenerationService;
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.OK)
    public ReportResponse generateReport(@Valid @RequestBody GenerateReportRequest request) {
        return reportGenerationService.generate(request);
    }
}
