package ai.bugpilot.backend.report.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "report_records")
public class ReportRecord {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 80)
    private String template;

    @Column(nullable = false, length = 30)
    private String severity;

    @Column(nullable = false, length = 10)
    private String priority;

    @Column(nullable = false, length = 120)
    private String area;

    @Column(nullable = false, length = 30)
    private String confidence;

    @Lob
    @Column(nullable = false)
    private String reportJson;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected ReportRecord() {
    }

    public ReportRecord(
            UUID id,
            String title,
            String template,
            String severity,
            String priority,
            String area,
            String confidence,
            String reportJson
    ) {
        this.id = id;
        this.title = title;
        this.template = template;
        this.severity = severity;
        this.priority = priority;
        this.area = area;
        this.confidence = confidence;
        this.reportJson = reportJson;
    }

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getTemplate() {
        return template;
    }

    public String getSeverity() {
        return severity;
    }

    public String getPriority() {
        return priority;
    }

    public String getArea() {
        return area;
    }

    public String getConfidence() {
        return confidence;
    }

    public String getReportJson() {
        return reportJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
