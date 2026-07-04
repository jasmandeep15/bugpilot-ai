package ai.bugpilot.backend.shared.rate;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "bugpilot.rate-limit")
public record RateLimitProperties(
        int requestsPerMinute
) {
}
