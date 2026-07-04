package ai.bugpilot.backend.report.service;

import ai.bugpilot.backend.report.dto.GenerateReportRequest;
import ai.bugpilot.backend.report.dto.ReportResponse;
import ai.bugpilot.backend.report.prompt.PromptTemplate;
import ai.bugpilot.backend.report.prompt.PromptTemplateCatalog;
import ai.bugpilot.backend.report.provider.ReportProvider;
import org.springframework.stereotype.Service;

@Service
public class ReportGenerationService {

    private final PromptTemplateCatalog promptTemplateCatalog;
    private final ReportProvider reportProvider;

    public ReportGenerationService(PromptTemplateCatalog promptTemplateCatalog, ReportProvider reportProvider) {
        this.promptTemplateCatalog = promptTemplateCatalog;
        this.reportProvider = reportProvider;
    }

    public ReportResponse generate(GenerateReportRequest request) {
        PromptTemplate promptTemplate = promptTemplateCatalog.find(request.template());
        return reportProvider.generate(request, promptTemplate);
    }
}
