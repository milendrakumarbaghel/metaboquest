package org.springboot.backend.quiz.entity;

import org.springboot.backend.common.DomainEnums.SessionStatus;
import org.springboot.backend.common.DomainEnums.LearningTopic;
import org.springboot.backend.question.entity.QuestionSet;
import org.springboot.backend.question.entity.QuizQuestion;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "quiz_sessions")
public class QuizSession {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "question_set_id") private QuestionSet questionSet;
    @Column(name = "question_set_version", nullable = false) private int questionSetVersion;
    @Enumerated(EnumType.STRING) @Column(name = "learning_topic", nullable = false) private LearningTopic learningTopic = LearningTopic.GENERAL;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private SessionStatus status;
    @Column(name = "started_at", nullable = false) private Instant startedAt;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "completed_at") private Instant completedAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "quiz_session_questions", joinColumns = @JoinColumn(name = "session_id"),
            inverseJoinColumns = @JoinColumn(name = "question_id"))
    @OrderColumn(name = "position")
    private List<QuizQuestion> questions = new ArrayList<>();
    protected QuizSession() { }
    public QuizSession(UUID id, QuestionSet set, Instant now, Instant expiresAt) {
        this.id = id; this.questionSet = set; this.questionSetVersion = set.getVersion();
        this.status = SessionStatus.STARTED; this.startedAt = now; this.expiresAt = expiresAt; this.createdAt = now;
    }
    public UUID getId() { return id; }
    public LearningTopic getLearningTopic() { return learningTopic; }
    public void setLearningTopic(LearningTopic topic) { learningTopic = topic; }
    public QuestionSet getQuestionSet() { return questionSet; }
    public int getQuestionSetVersion() { return questionSetVersion; }
    public SessionStatus getStatus() { return status; }
    public Instant getExpiresAt() { return expiresAt; }
    public List<QuizQuestion> getQuestions() { return Collections.unmodifiableList(questions); }
    public void assignQuestions(List<QuizQuestion> selected) {
        if (!questions.isEmpty() || selected.isEmpty()) throw new IllegalStateException("Questions must be assigned once at session creation");
        questions.addAll(selected);
    }
    public void complete(Instant now) { status = SessionStatus.COMPLETED; completedAt = now; }
    public void expire() { status = SessionStatus.EXPIRED; }
}
