package ai.bugpilot.backend.report.service;

import ai.bugpilot.backend.report.dto.ReportResponse;
import ai.bugpilot.backend.report.dto.ReportSummaryResponse;
import ai.bugpilot.backend.report.persistence.ReportRecord;
import ai.bugpilot.backend.report.persistence.ReportRecordRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class SavedReportService {

    private final ReportRecordRepository reportRecordRepository;
    private final ObjectMapper objectMapper;

    public SavedReportService(ReportRecordRepository reportRecordRepository, ObjectMapper objectMapper) {
        this.reportRecordRepository = reportRecordRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void save(ReportResponse report) {
        try {
            ReportRecord record = new ReportRecord(
                    UUID.randomUUID(),
                    report.title(),
                    report.template(),
                    report.severity(),
                    report.priority(),
                    report.area(),
                    report.confidence(),
                    objectMapper.writeValueAsString(report)
            );
            reportRecordRepository.save(record);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not persist generated report", exception);
        }
    }

    @Transactional(readOnly = true)
    public List<ReportSummaryResponse> recent() {
        return reportRecordRepository.findTop20ByOrderByCreatedAtDesc()
                .stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReportResponse find(UUID id) {
        ReportRecord record = reportRecordRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Report not found"));
        try {
            return objectMapper.readValue(record.getReportJson(), ReportResponse.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Saved report could not be read", exception);
        }
    }

    private ReportSummaryResponse toSummary(ReportRecord record) {
        return new ReportSummaryResponse(
                record.getId(),
                record.getTitle(),
                record.getTemplate(),
                record.getSeverity(),
                record.getPriority(),
                record.getArea(),
                record.getConfidence(),
                record.getCreatedAt()
        );
    }
}
