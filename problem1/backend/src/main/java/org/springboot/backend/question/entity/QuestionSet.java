package org.springboot.backend.question.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "question_sets")
public class QuestionSet {
    @Id private UUID id;
    @Column(nullable = false, length = 160) private String title;
    @Column(nullable = false, length = 500) private String description;
    @Column(nullable = false) private int version;
    @Column(nullable = false, length = 10) private String language;
    @Column(nullable = false) private boolean active;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    protected QuestionSet() { }
    public UUID getId() { return id; }
    public int getVersion() { return version; }
    public boolean isActive() { return active; }
}
