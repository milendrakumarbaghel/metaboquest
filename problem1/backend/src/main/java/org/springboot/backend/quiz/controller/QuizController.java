package org.springboot.backend.quiz.controller;

import org.springboot.backend.quiz.dto.QuizDtos.*;
import org.springboot.backend.quiz.service.QuizService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/quiz")
@Validated
public class QuizController {
    private final QuizService service;
    public QuizController(QuizService service) { this.service=service; }

    @PostMapping("/sessions")
    public ResponseEntity<StartSessionResponse> start(@Valid @RequestBody(required = false) StartSessionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.start(request == null ? null : request.topic()));
    }

    @GetMapping("/questions")
    public QuestionsResponse questions(@RequestParam UUID sessionId) { return service.getQuestions(sessionId); }

    @PostMapping("/submit")
    public QuizResultResponse submit(@Valid @RequestBody SubmitRequest request) { return service.submit(request); }

    @GetMapping("/results/{attemptId}")
    public QuizResultResponse result(@PathVariable UUID attemptId, @RequestParam @NotBlank String token) {
        return service.getResult(attemptId, token);
    }
}
