package org.springboot.backend.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.time.Instant;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);
    private final DistributedRateLimitService rateLimits;
    private final RateLimitProperties properties;
    public RateLimitFilter(DistributedRateLimitService rateLimits, RateLimitProperties properties) {
        this.rateLimits = rateLimits; this.properties = properties;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Limit rule = limitFor(request);
        if (rule != null) {
            try {
                var decision = rateLimits.consume(request.getRemoteAddr(), rule.routeKey(), rule.limit(), Instant.now());
                response.setHeader("X-RateLimit-Remaining", Integer.toString(decision.remaining()));
                response.setHeader("X-RateLimit-Reset", Long.toString(decision.resetAt().getEpochSecond()));
                if (!decision.allowed()) {
                    response.setHeader("Retry-After", Long.toString(Math.max(1, decision.resetAt().getEpochSecond() - Instant.now().getEpochSecond())));
                    response.setStatus(429);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write("{\"status\":429,\"error\":\"TOO_MANY_REQUESTS\",\"message\":\"Rate limit exceeded\"}");
                    return;
                }
            } catch (RuntimeException ex) {
                log.error("Distributed rate limiter unavailable", ex);
                response.setStatus(503);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"status\":503,\"error\":\"SERVICE_UNAVAILABLE\",\"message\":\"Request protection service unavailable\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private Limit limitFor(HttpServletRequest request) {
        if (!"POST".equals(request.getMethod())) return null;
        String path = request.getRequestURI();
        if (path.endsWith("/quiz/submit")) return new Limit("quiz-submit", properties.quizSubmissionLimit());
        if (path.endsWith("/challenges")) return new Limit("challenge-create", properties.challengeCreationLimit());
        if (path.endsWith("/analytics/events")) return new Limit("analytics-event", properties.analyticsEventLimit());
        return null;
    }
    private record Limit(String routeKey, int limit) { }
}
