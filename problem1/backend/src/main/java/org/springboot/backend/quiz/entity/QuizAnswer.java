package org.springboot.backend.quiz.entity;

import org.springboot.backend.question.entity.*;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "quiz_answers")
public class QuizAnswer {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "attempt_id") private QuizAttempt attempt;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "question_id") private QuizQuestion question;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "selected_option_id") private QuestionOption selectedOption;
    @Column(name = "is_correct", nullable = false) private boolean correct;
    @Column(name = "points_awarded", nullable = false) private int pointsAwarded;
    protected QuizAnswer() { }
    public QuizAnswer(UUID id, QuizAttempt attempt, QuizQuestion question, QuestionOption option, boolean correct, int points) {
        this.id=id; this.attempt=attempt; this.question=question; this.selectedOption=option; this.correct=correct; this.pointsAwarded=points;
    }
    public QuizQuestion getQuestion() { return question; }
    public boolean isCorrect() { return correct; }
    public int getPointsAwarded() { return pointsAwarded; }
}
