package ai.bugpilot.backend.report.service;

import ai.bugpilot.backend.report.dto.GenerateReportRequest;
import ai.bugpilot.backend.report.dto.ReportResponse;
import ai.bugpilot.backend.report.prompt.PromptTemplate;
import ai.bugpilot.backend.report.prompt.PromptTemplateCatalog;
import ai.bugpilot.backend.report.provider.DeterministicReportProvider;
import ai.bugpilot.backend.report.provider.OpenAiReportProvider;
import ai.bugpilot.backend.shared.config.AiProperties;
import org.springframework.stereotype.Service;

@Service
public class ReportGenerationService {

    private final PromptTemplateCatalog promptTemplateCatalog;
    private final DeterministicReportProvider deterministicReportProvider;
    private final OpenAiReportProvider openAiReportProvider;
    private final AiProperties aiProperties;
    private final SavedReportService savedReportService;

    public ReportGenerationService(
            PromptTemplateCatalog promptTemplateCatalog,
            DeterministicReportProvider deterministicReportProvider,
            OpenAiReportProvider openAiReportProvider,
            AiProperties aiProperties,
            SavedReportService savedReportService
    ) {
        this.promptTemplateCatalog = promptTemplateCatalog;
        this.deterministicReportProvider = deterministicReportProvider;
        this.openAiReportProvider = openAiReportProvider;
        this.aiProperties = aiProperties;
        this.savedReportService = savedReportService;
    }

    public ReportResponse generate(GenerateReportRequest request) {
        PromptTemplate promptTemplate = promptTemplateCatalog.find(request.template());
        ReportResponse report;
        if (aiProperties.openAiEnabled()) {
            report = openAiReportProvider.generate(request, promptTemplate);
        } else {
            report = deterministicReportProvider.generate(request, promptTemplate);
        }
        savedReportService.save(report);
        return report;
    }
}
