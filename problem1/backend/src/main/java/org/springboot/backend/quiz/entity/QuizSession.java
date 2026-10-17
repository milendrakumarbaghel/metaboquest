package org.springboot.backend.quiz.entity;

import org.springboot.backend.common.DomainEnums.SessionStatus;
import org.springboot.backend.question.entity.QuestionSet;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "quiz_sessions")
public class QuizSession {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "question_set_id") private QuestionSet questionSet;
    @Column(name = "question_set_version", nullable = false) private int questionSetVersion;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private SessionStatus status;
    @Column(name = "started_at", nullable = false) private Instant startedAt;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "completed_at") private Instant completedAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected QuizSession() { }
    public QuizSession(UUID id, QuestionSet set, Instant now, Instant expiresAt) {
        this.id = id; this.questionSet = set; this.questionSetVersion = set.getVersion();
        this.status = SessionStatus.STARTED; this.startedAt = now; this.expiresAt = expiresAt; this.createdAt = now;
    }
    public UUID getId() { return id; }
    public QuestionSet getQuestionSet() { return questionSet; }
    public int getQuestionSetVersion() { return questionSetVersion; }
    public SessionStatus getStatus() { return status; }
    public Instant getExpiresAt() { return expiresAt; }
    public void complete(Instant now) { status = SessionStatus.COMPLETED; completedAt = now; }
    public void expire() { status = SessionStatus.EXPIRED; }
}
