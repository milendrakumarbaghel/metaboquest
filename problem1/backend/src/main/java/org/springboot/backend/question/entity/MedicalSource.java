package org.springboot.backend.question.entity;

import org.springboot.backend.common.DomainEnums.SourceType;
import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "medical_sources")
public class MedicalSource {
    @Id private UUID id;
    @Column(nullable = false, length = 300) private String title;
    @Column(nullable = false, length = 200) private String organization;
    @Column(name = "source_url", nullable = false, length = 1000) private String sourceUrl;
    @Column(name = "publication_date") private LocalDate publicationDate;
    @Column(name = "accessed_at") private Instant accessedAt;
    @Enumerated(EnumType.STRING) @Column(name = "source_type", nullable = false) private SourceType sourceType;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected MedicalSource() { }
    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public String getOrganization() { return organization; }
    public String getSourceUrl() { return sourceUrl; }
    public LocalDate getPublicationDate() { return publicationDate; }
}
