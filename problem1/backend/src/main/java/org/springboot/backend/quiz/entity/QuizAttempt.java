package org.springboot.backend.quiz.entity;

import org.springboot.backend.common.DomainEnums.ProfileType;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "quiz_attempts")
public class QuizAttempt {
    @Id private UUID id;
    @OneToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "session_id", unique = true) private QuizSession session;
    @Column(nullable = false) private int score;
    @Column(name = "total_questions", nullable = false) private int totalQuestions;
    @Column(name = "correct_answers", nullable = false) private int correctAnswers;
    @Enumerated(EnumType.STRING) @Column(name = "profile_type", nullable = false) private ProfileType profileType;
    @Column(name = "submission_hash", nullable = false, length = 64) private String submissionHash;
    @Column(name = "result_token_hash", nullable = false, unique = true, length = 64) private String resultTokenHash;
    @Column(name = "completed_at", nullable = false) private Instant completedAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @OneToMany(mappedBy = "attempt", fetch = FetchType.LAZY) private List<QuizAnswer> answers = new ArrayList<>();
    protected QuizAttempt() { }
    public QuizAttempt(UUID id, QuizSession session, int score, int totalQuestions, int correctAnswers,
                       ProfileType profileType, String submissionHash, String resultTokenHash, Instant now) {
        this.id=id; this.session=session; this.score=score; this.totalQuestions=totalQuestions;
        this.correctAnswers=correctAnswers; this.profileType=profileType; this.submissionHash=submissionHash;
        this.resultTokenHash=resultTokenHash; this.completedAt=now; this.createdAt=now;
    }
    public UUID getId() { return id; }
    public int getScore() { return score; }
    public int getTotalQuestions() { return totalQuestions; }
    public int getCorrectAnswers() { return correctAnswers; }
    public ProfileType getProfileType() { return profileType; }
    public String getSubmissionHash() { return submissionHash; }
    public String getResultTokenHash() { return resultTokenHash; }
    public List<QuizAnswer> getAnswers() { return answers; }
}
