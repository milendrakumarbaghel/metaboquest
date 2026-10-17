package org.springboot.backend.question.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "question_options")
public class QuestionOption {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "question_id") private QuizQuestion question;
    @Column(name = "option_text", nullable = false, length = 500) private String optionText;
    @Column(name = "is_correct", nullable = false) private boolean correct;
    @Column(name = "display_order", nullable = false) private int displayOrder;
    protected QuestionOption() { }
    public UUID getId() { return id; }
    public QuizQuestion getQuestion() { return question; }
    public String getOptionText() { return optionText; }
    public boolean isCorrect() { return correct; }
}
