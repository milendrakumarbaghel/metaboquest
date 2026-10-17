package org.springboot.backend.analytics.controller;

import org.springboot.backend.analytics.dto.AnalyticsDtos.*;
import org.springboot.backend.analytics.service.AnalyticsService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/analytics/events")
public class AnalyticsController {
    private final AnalyticsService service;
    public AnalyticsController(AnalyticsService service) { this.service=service; }
    @PostMapping
    public ResponseEntity<EventResponse> record(@Valid @RequestBody EventRequest request) {
        EventResponse result = service.record(request);
        return ResponseEntity.status(result.accepted() ? HttpStatus.CREATED : HttpStatus.ACCEPTED).body(result);
    }
}
