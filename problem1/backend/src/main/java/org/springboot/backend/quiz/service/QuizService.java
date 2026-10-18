package org.springboot.backend.quiz.service;

import org.springboot.backend.common.DomainEnums.SessionStatus;
import org.springboot.backend.common.DomainEnums.LearningTopic;
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
import java.security.SecureRandom;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class QuizService {
    private static final int QUESTIONS_PER_QUIZ = 3;
    /** Topics used to top up a topic that has fewer than three published questions. */
    private static final Map<LearningTopic, List<LearningTopic>> RELATED_TOPICS = Map.of(
            LearningTopic.SAFETY, List.of(LearningTopic.SIDE_EFFECTS, LearningTopic.ELIGIBILITY),
            LearningTopic.SIDE_EFFECTS, List.of(LearningTopic.SAFETY),
            LearningTopic.MUSCLE, List.of(LearningTopic.MAINTENANCE, LearningTopic.SAFETY),
            LearningTopic.MAINTENANCE, List.of(LearningTopic.MUSCLE, LearningTopic.ELIGIBILITY),
            LearningTopic.DIABETES, List.of(LearningTopic.ELIGIBILITY, LearningTopic.SAFETY),
            LearningTopic.ELIGIBILITY, List.of(LearningTopic.DIABETES, LearningTopic.SAFETY));
    private final SecureRandom random = new SecureRandom();
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
    public StartSessionResponse start(LearningTopic requestedTopic) {
        LearningTopic topic = requestedTopic == null ? LearningTopic.GENERAL : requestedTopic;
        QuestionSet set = questions.activeSet();
        List<QuizQuestion> pool = new ArrayList<>(questions.publishedQuestions(set.getId()));
        if (pool.size() < QUESTIONS_PER_QUIZ) throw ApiException.notFound("Not enough approved questions are available");
        Collections.shuffle(pool, random);
        List<QuizQuestion> selected = new ArrayList<>();
        if (topic == LearningTopic.GENERAL) {
            // A general quiz covers different concerns rather than drawing three similar questions.
            Set<LearningTopic> covered = new HashSet<>();
            for (QuizQuestion question : pool) {
                if (covered.add(question.getLearningTopic())) selected.add(question);
                if (selected.size() == QUESTIONS_PER_QUIZ) break;
            }
        } else {
            // On-topic questions always come first; related topics, then anything published, only top up a thin topic.
            List<LearningTopic> order = new ArrayList<>(List.of(topic));
            order.addAll(RELATED_TOPICS.getOrDefault(topic, List.of()));
            for (LearningTopic candidate : order) {
                for (QuizQuestion question : pool) {
                    if (selected.size() == QUESTIONS_PER_QUIZ) break;
                    if (question.getLearningTopic() == candidate && !selected.contains(question)) selected.add(question);
                }
            }
        }
        for (QuizQuestion question : pool) {
            if (selected.size() == QUESTIONS_PER_QUIZ) break;
            if (!selected.contains(question)) selected.add(question);
        }
        Instant now = clock.instant();
        QuizSession session = new QuizSession(UUID.randomUUID(), set, now, now.plus(properties.sessionTtl()));
        session.setLearningTopic(topic);
        session.assignQuestions(selected);
        sessions.save(session);
        return new StartSessionResponse(session.getId(), set.getId(), set.getVersion(), session.getQuestions().size(), session.getStatus(), topic);
    }

    @Transactional(readOnly = true)
    public QuestionsResponse getQuestions(UUID sessionId) {
        QuizSession session = sessions.findDetailedById(sessionId).orElseThrow(() -> ApiException.notFound("Quiz session not found"));
        ensureUsableForReading(session);
        List<QuizQuestion> published = session.getQuestions();
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

        List<QuizQuestion> published = session.getQuestions();
        Map<UUID, QuizQuestion> byId = published.stream().collect(Collectors.toMap(QuizQuestion::getId, Function.identity()));
        Set<UUID> submittedIds = request.answers().stream().map(AnswerRequest::questionId).collect(Collectors.toSet());
        if (submittedIds.size() != request.answers().size()) throw ApiException.unprocessable("Duplicate question answers are not allowed");
        if (published.isEmpty() || !submittedIds.equals(byId.keySet()))
            throw ApiException.unprocessable("All questions assigned to this session must be answered exactly once");

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
                new NextStepResponse("Want a doctor to look at your own numbers?", "See if the programme fits you", properties.steerWebsiteUrl()), properties.resultDisclaimer());
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
