package ai.bugpilot.backend.report.api;

import ai.bugpilot.backend.report.dto.GenerateReportRequest;
import ai.bugpilot.backend.report.dto.ReportResponse;
import ai.bugpilot.backend.report.dto.ReportSummaryResponse;
import ai.bugpilot.backend.report.service.ReportGenerationService;
import ai.bugpilot.backend.report.service.SavedReportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportGenerationService reportGenerationService;
    private final SavedReportService savedReportService;

    public ReportController(ReportGenerationService reportGenerationService, SavedReportService savedReportService) {
        this.reportGenerationService = reportGenerationService;
        this.savedReportService = savedReportService;
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.OK)
    public ReportResponse generateReport(@Valid @RequestBody GenerateReportRequest request) {
        return reportGenerationService.generate(request);
    }

    @GetMapping
    public List<ReportSummaryResponse> recentReports() {
        return savedReportService.recent();
    }

    @GetMapping("/{id}")
    public ReportResponse savedReport(@PathVariable UUID id) {
        return savedReportService.find(id);
    }
}
