package org.springboot.backend.challenge.controller;

import org.springboot.backend.challenge.dto.ChallengeDtos.*;
import org.springboot.backend.challenge.service.ChallengeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/challenges")
@Validated
public class ChallengeController {
    private final ChallengeService service;
    public ChallengeController(ChallengeService service) { this.service=service; }
    @PostMapping
    public ResponseEntity<ChallengeResponse> create(@Valid @RequestBody CreateChallengeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }
    @GetMapping("/{code}")
    public PublicChallengeResponse get(@PathVariable @Pattern(regexp="[A-Za-z0-9_-]{16}") String code) { return service.get(code); }
}
