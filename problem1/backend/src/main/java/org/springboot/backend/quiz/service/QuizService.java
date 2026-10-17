package org.springboot.backend.quiz.service;

import org.springboot.backend.common.DomainEnums.SessionStatus;
import org.springboot.backend.common.exception.ApiException;
import org.springboot.backend.common.util.SecureTokenService;
import org.springboot.backend.config.MetaboQuestProperties;
import org.springboot.backend.config.ResultTokenProperties;
import org.springboot.backend.gamification.GamificationService;
import org.springboot.backend.question.entity.*;
import org.springboot.backend.question.service.QuestionService;
import org.springboot.backend.quiz.dto.QuizDtos.*;
import org.springboot.backend.quiz.entity.*;
import org.springboot.backend.quiz.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class QuizService {
    private final QuestionService questions;
    private final QuizSessionRepository sessions;
    private final QuizAttemptRepository attempts;
    private final QuizAnswerRepository answers;
    private final GamificationService gamification;
    private final SecureTokenService tokens;
    private final MetaboQuestProperties properties;
    private final ResultTokenProperties resultTokenProperties;
    private final Clock clock;

    @Autowired
    public QuizService(QuestionService questions, QuizSessionRepository sessions, QuizAttemptRepository attempts,
                       QuizAnswerRepository answers, GamificationService gamification, SecureTokenService tokens,
                       MetaboQuestProperties properties, ResultTokenProperties resultTokenProperties) {
        this(questions, sessions, attempts, answers, gamification, tokens, properties, resultTokenProperties, Clock.systemUTC());
    }

    QuizService(QuestionService questions, QuizSessionRepository sessions, QuizAttemptRepository attempts,
                QuizAnswerRepository answers, GamificationService gamification, SecureTokenService tokens,
                MetaboQuestProperties properties, ResultTokenProperties resultTokenProperties, Clock clock) {
        this.questions=questions; this.sessions=sessions; this.attempts=attempts; this.answers=answers;
        this.gamification=gamification; this.tokens=tokens; this.properties=properties;
        this.resultTokenProperties=resultTokenProperties; this.clock=clock;
    }

    @Transactional
    public StartSessionResponse start() {
        QuestionSet set = questions.activeSet();
        int count = questions.publishedQuestions(set.getId()).size();
        Instant now = clock.instant();
        QuizSession session = sessions.save(new QuizSession(UUID.randomUUID(), set, now, now.plus(properties.sessionTtl())));
        return new StartSessionResponse(session.getId(), set.getId(), set.getVersion(), count, session.getStatus());
    }

    @Transactional(readOnly = true)
    public QuestionsResponse getQuestions(UUID sessionId) {
        QuizSession session = sessions.findDetailedById(sessionId).orElseThrow(() -> ApiException.notFound("Quiz session not found"));
        ensureUsableForReading(session);
        List<QuizQuestion> published = questions.publishedQuestions(session.getQuestionSet().getId());
        return questions.publicResponse(session.getQuestionSetVersion(), published);
    }

    @Transactional
    public QuizResultResponse submit(SubmitRequest request) {
        String submissionHash = submissionHash(request.answers());
        QuizSession session = sessions.findByIdForUpdate(request.sessionId())
                .orElseThrow(() -> ApiException.notFound("Quiz session not found"));
        Optional<QuizAttempt> existing = attempts.findBySessionId(session.getId());
        if (existing.isPresent()) {
            if (!existing.get().getSubmissionHash().equals(submissionHash))
                throw ApiException.conflict("This session was already completed with different answers");
            return result(existing.get(), capabilityFor(existing.get()));
        }
        if (session.getStatus() == SessionStatus.COMPLETED)
            throw ApiException.conflict("This quiz session has already been completed");
        ensureNotExpired(session);

        List<QuizQuestion> published = questions.publishedQuestions(session.getQuestionSet().getId());
        Map<UUID, QuizQuestion> byId = published.stream().collect(Collectors.toMap(QuizQuestion::getId, Function.identity()));
        Set<UUID> submittedIds = request.answers().stream().map(AnswerRequest::questionId).collect(Collectors.toSet());
        if (submittedIds.size() != request.answers().size()) throw ApiException.unprocessable("Duplicate question answers are not allowed");
        if (!submittedIds.equals(byId.keySet())) throw ApiException.unprocessable("All published questions must be answered exactly once");

        record Evaluated(QuizQuestion question, QuestionOption option, boolean correct) { }
        List<Evaluated> evaluated = new ArrayList<>();
        for (AnswerRequest answer : request.answers()) {
            QuizQuestion question = byId.get(answer.questionId());
            QuestionOption option = question.getOptions().stream().filter(o -> o.getId().equals(answer.selectedOptionId())).findFirst()
                    .orElseThrow(() -> ApiException.unprocessable("Selected option does not belong to question " + answer.questionId()));
            evaluated.add(new Evaluated(question, option, option.isCorrect()));
        }

        int correct = (int) evaluated.stream().filter(Evaluated::correct).count();
        int score = correct * gamification.pointsPerCorrectAnswer();
        Instant now = clock.instant();
        UUID attemptId = UUID.randomUUID();
        String resultToken = tokens.resultCapability(attemptId, resultTokenProperties.secret());
        QuizAttempt attempt = attempts.save(new QuizAttempt(attemptId, session, score, published.size(), correct,
                gamification.profileFor(score), submissionHash, tokens.hash(resultToken), now));
        List<QuizAnswer> stored = evaluated.stream().map(e -> new QuizAnswer(UUID.randomUUID(), attempt, e.question(), e.option(),
                e.correct(), e.correct() ? gamification.pointsPerCorrectAnswer() : 0)).toList();
        answers.saveAll(stored);
        session.complete(now);
        return result(attempt, resultToken, stored);
    }

    @Transactional(readOnly = true)
    public QuizResultResponse getResult(UUID attemptId, String token) {
        QuizAttempt attempt = attempts.findById(attemptId).orElseThrow(() -> ApiException.notFound("Quiz result not found"));
        if (!isAuthorized(attempt, token)) throw ApiException.notFound("Quiz result not found");
        return result(attempt, null);
    }

    @Transactional(readOnly = true)
    public QuizAttempt authorizedAttempt(UUID attemptId, String token) {
        QuizAttempt attempt = attempts.findById(attemptId).orElseThrow(() -> ApiException.notFound("Quiz result not found"));
        if (!isAuthorized(attempt, token)) throw ApiException.notFound("Quiz result not found");
        return attempt;
    }

    private boolean isAuthorized(QuizAttempt attempt, String token) {
        return tokens.matches(token, attempt.getResultTokenHash())
                || tokens.matches(token, tokens.hash(capabilityFor(attempt)));
    }

    private String capabilityFor(QuizAttempt attempt) {
        return tokens.resultCapability(attempt.getId(), resultTokenProperties.secret());
    }

    private QuizResultResponse result(QuizAttempt attempt, String token) {
        return result(attempt, token, answers.findDetailedByAttemptId(attempt.getId()));
    }

    private QuizResultResponse result(QuizAttempt attempt, String token, List<QuizAnswer> stored) {
        List<FeedbackResponse> feedback = stored.stream().map(a -> {
            QuizQuestion q = a.getQuestion();
            List<SourceResponse> sources = q.getSources().stream().map(s -> new SourceResponse(s.getTitle(), s.getOrganization(),
                    s.getSourceUrl(), s.getPublicationDate() == null ? null : s.getPublicationDate().toString())).toList();
            return new FeedbackResponse(q.getId(), a.isCorrect(), q.getExplanation(), sources);
        }).toList();
        return new QuizResultResponse(attempt.getId(), token, attempt.getScore(), gamification.maximumScore(attempt.getTotalQuestions()),
                attempt.getCorrectAnswers(), attempt.getTotalQuestions(), gamification.describe(attempt.getProfileType()), feedback,
                new NextStepResponse("Explore doctor-led metabolic care", "Explore Steer", properties.steerWebsiteUrl()), properties.resultDisclaimer());
    }

    private void ensureUsableForReading(QuizSession session) {
        if (session.getStatus() != SessionStatus.STARTED) throw ApiException.conflict("Quiz session is not active");
        ensureNotExpired(session);
    }

    private void ensureNotExpired(QuizSession session) {
        if (!session.getExpiresAt().isAfter(clock.instant())) {
            session.expire();
            throw ApiException.unprocessable("Quiz session has expired");
        }
    }

    private String submissionHash(List<AnswerRequest> submitted) {
        String canonical = submitted.stream().sorted(Comparator.comparing(a -> a.questionId().toString()))
                .map(a -> a.questionId() + ":" + a.selectedOptionId()).collect(Collectors.joining("|"));
        return tokens.hash(canonical);
    }
}
