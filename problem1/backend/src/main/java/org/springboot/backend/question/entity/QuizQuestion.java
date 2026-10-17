package org.springboot.backend.question.entity;

import org.springboot.backend.common.DomainEnums.*;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "quiz_questions")
public class QuizQuestion {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "question_set_id") private QuestionSet questionSet;
    @Column(name = "question_text", nullable = false, columnDefinition = "text") private String questionText;
    @Enumerated(EnumType.STRING) @Column(name = "question_type", nullable = false) private QuestionType questionType;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private QuestionCategory category;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Difficulty difficulty;
    @Column(nullable = false, columnDefinition = "text") private String explanation;
    @Column(name = "display_order", nullable = false) private int displayOrder;
    @Column(nullable = false) private boolean active;
    @Enumerated(EnumType.STRING) @Column(name = "review_status", nullable = false) private ReviewStatus reviewStatus;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @OneToMany(mappedBy = "question", fetch = FetchType.LAZY) @OrderBy("displayOrder") private List<QuestionOption> options = new ArrayList<>();
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "question_medical_sources", joinColumns = @JoinColumn(name = "question_id"), inverseJoinColumns = @JoinColumn(name = "source_id"))
    private Set<MedicalSource> sources = new LinkedHashSet<>();
    protected QuizQuestion() { }
    public UUID getId() { return id; }
    public QuestionSet getQuestionSet() { return questionSet; }
    public String getQuestionText() { return questionText; }
    public QuestionType getQuestionType() { return questionType; }
    public QuestionCategory getCategory() { return category; }
    public String getExplanation() { return explanation; }
    public int getDisplayOrder() { return displayOrder; }
    public List<QuestionOption> getOptions() { return options; }
    public Set<MedicalSource> getSources() { return sources; }
}
