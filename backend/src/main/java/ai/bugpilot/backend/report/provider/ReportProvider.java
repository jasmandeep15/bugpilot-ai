package ai.bugpilot.backend.report.provider;

import ai.bugpilot.backend.report.dto.GenerateReportRequest;
import ai.bugpilot.backend.report.dto.ReportResponse;
import ai.bugpilot.backend.report.prompt.PromptTemplate;

public interface ReportProvider {

    ReportResponse generate(GenerateReportRequest request, PromptTemplate promptTemplate);
}
