package org.springboot.backend.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import static org.springboot.backend.domain.DomainTypes.*;

@Entity @Table(name="content_packages")
public class ContentPackage {
    @Id private UUID id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="paper_id") private Paper paper;
    @Column(nullable=false, length=16) private String language;
    @Column(nullable=false, length=500) private String audience;
    @Column(name="core_message", nullable=false, length=1000) private String coreMessage;
    @Column(nullable=false, columnDefinition="text") private String reasoning;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private PackageStatus status;
    @Column(name="ai_provider", nullable=false, length=100) private String aiProvider;
    @Column(name="prompt_version", nullable=false, length=40) private String promptVersion;
    @Column(name="estimated_human_minutes", nullable=false) private int estimatedHumanMinutes;
    @Column(name="created_at", nullable=false) private Instant createdAt;
    @Column(name="updated_at", nullable=false) private Instant updatedAt;
    protected ContentPackage() {}
    public ContentPackage(UUID id, Paper paper, String language, String audience, String coreMessage, String reasoning, String provider, String promptVersion, int minutes, Instant now) {
        this.id=id; this.paper=paper; this.language=language; this.audience=audience; this.coreMessage=coreMessage; this.reasoning=reasoning; this.aiProvider=provider; this.promptVersion=promptVersion; this.estimatedHumanMinutes=minutes; this.status=PackageStatus.AWAITING_REVIEW; this.createdAt=now; this.updatedAt=now;
    }
    public void status(PackageStatus value, Instant now){status=value;updatedAt=now;}
    public UUID getId(){return id;} public Paper getPaper(){return paper;} public String getLanguage(){return language;} public String getAudience(){return audience;} public String getCoreMessage(){return coreMessage;} public String getReasoning(){return reasoning;} public PackageStatus getStatus(){return status;} public String getAiProvider(){return aiProvider;} public String getPromptVersion(){return promptVersion;} public int getEstimatedHumanMinutes(){return estimatedHumanMinutes;} public Instant getCreatedAt(){return createdAt;} public Instant getUpdatedAt(){return updatedAt;}
}
