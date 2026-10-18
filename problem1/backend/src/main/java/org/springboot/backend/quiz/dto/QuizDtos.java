package org.springboot.backend.quiz.dto;

import org.springboot.backend.common.DomainEnums.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;

public final class QuizDtos {
    private QuizDtos() { }
    public record StartSessionRequest(LearningTopic topic) { }
    public record StartSessionResponse(UUID sessionId, UUID questionSetId, int questionSetVersion, int totalQuestions, SessionStatus status, LearningTopic topic) { }
    public record OptionResponse(UUID id, String text) { }
    public record QuestionResponse(UUID id, QuestionType type, QuestionCategory category, String questionText, List<OptionResponse> options) { }
    public record QuestionsResponse(int questionSetVersion, int totalQuestions, List<QuestionResponse> questions) { }
    public record AnswerRequest(@NotNull UUID questionId, @NotNull UUID selectedOptionId) { }
    public record SubmitRequest(@NotNull UUID sessionId, @NotEmpty @Size(max=20) List<@Valid AnswerRequest> answers) { }
    public record ProfileResponse(ProfileType code, String title, String description) { }
    public record SourceResponse(String title, String organization, String url, String publicationDate) { }
    public record FeedbackResponse(UUID questionId, boolean correct, String explanation, List<SourceResponse> sources) { }
    public record NextStepResponse(String title, String ctaText, String ctaUrl) { }
    public record QuizResultResponse(UUID attemptId, String resultToken, int score, int maxScore, int correctAnswers,
                                     int totalQuestions, ProfileResponse profile, List<FeedbackResponse> feedback,
                                     NextStepResponse nextStep, String disclaimer) { }
}
