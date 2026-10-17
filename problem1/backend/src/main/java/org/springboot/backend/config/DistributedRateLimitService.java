package org.springboot.backend.config;

import org.springboot.backend.common.util.SecureTokenService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class DistributedRateLimitService {
    private static final String INCREMENT_SQL = """
            INSERT INTO api_rate_limits (client_key, route_key, window_start, request_count, expires_at)
            VALUES (?, ?, ?, 1, ?)
            ON CONFLICT (client_key, route_key, window_start)
            DO UPDATE SET request_count = api_rate_limits.request_count + 1
            RETURNING request_count
            """;
    private final JdbcTemplate jdbc;
    private final SecureTokenService tokens;
    private final RateLimitProperties properties;

    public DistributedRateLimitService(JdbcTemplate jdbc, SecureTokenService tokens, RateLimitProperties properties) {
        this.jdbc = jdbc; this.tokens = tokens; this.properties = properties;
    }

    public Decision consume(String clientAddress, String routeKey, int limit, Instant now) {
        long windowSeconds = properties.window().toSeconds();
        long bucketEpoch = Math.floorDiv(now.getEpochSecond(), windowSeconds) * windowSeconds;
        Instant windowStart = Instant.ofEpochSecond(bucketEpoch);
        Instant resetAt = windowStart.plusSeconds(windowSeconds);
        String clientKey = tokens.keyedHash(clientAddress, properties.hashSecret());
        Integer count = jdbc.queryForObject(INCREMENT_SQL, Integer.class, clientKey, routeKey,
                Timestamp.from(windowStart), Timestamp.from(resetAt.plusSeconds(windowSeconds)));
        if (ThreadLocalRandom.current().nextInt(1_000) == 0)
            jdbc.update("DELETE FROM api_rate_limits WHERE expires_at < ?", Timestamp.from(now));
        int used = count == null ? limit + 1 : count;
        return new Decision(used <= limit, Math.max(0, limit - used), resetAt);
    }

    public record Decision(boolean allowed, int remaining, Instant resetAt) { }
}
