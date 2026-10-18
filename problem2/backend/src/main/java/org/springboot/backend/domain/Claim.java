package org.springboot.backend.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import static org.springboot.backend.domain.DomainTypes.*;

@Entity @Table(name="claims")
public class Claim {
    @Id private UUID id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="package_id") private ContentPackage contentPackage;
    @Column(name="claim_text", nullable=false, columnDefinition="text") private String claimText;
    @Column(name="plain_language", nullable=false, columnDefinition="text") private String plainLanguage;
    @Column(name="evidence_quote", nullable=false, columnDefinition="text") private String evidenceQuote;
    @Column(name="page_number", nullable=false) private int pageNumber;
    @Column(name="section_name", length=300) private String sectionName;
    @Column(nullable=false, precision=4, scale=3) private BigDecimal confidence;
    @Column(name="evidence_verified", nullable=false) private boolean evidenceVerified;
    @Enumerated(EnumType.STRING) @Column(name="review_status", nullable=false) private ClaimReviewStatus reviewStatus;
    @Column(length=200) private String reviewer;
    @Column(name="review_note", length=1000) private String reviewNote;
    @Column(name="reviewed_at") private Instant reviewedAt;
    @Column(name="created_at", nullable=false) private Instant createdAt;
    protected Claim() {}
    public Claim(UUID id, ContentPackage contentPackage, String claimText, String plainLanguage, String evidenceQuote, int pageNumber, String sectionName, double confidence, boolean verified, Instant now) {
        this.id=id;this.contentPackage=contentPackage;this.claimText=claimText;this.plainLanguage=plainLanguage;this.evidenceQuote=evidenceQuote;this.pageNumber=pageNumber;this.sectionName=sectionName;this.confidence=BigDecimal.valueOf(confidence);this.evidenceVerified=verified;this.reviewStatus=ClaimReviewStatus.PENDING;this.createdAt=now;
    }
    public void review(ClaimReviewStatus status,String reviewer,String note,Instant now){this.reviewStatus=status;this.reviewer=reviewer;this.reviewNote=note;this.reviewedAt=now;}
    public UUID getId(){return id;} public ContentPackage getContentPackage(){return contentPackage;} public String getClaimText(){return claimText;} public String getPlainLanguage(){return plainLanguage;} public String getEvidenceQuote(){return evidenceQuote;} public int getPageNumber(){return pageNumber;} public String getSectionName(){return sectionName;} public BigDecimal getConfidence(){return confidence;} public boolean isEvidenceVerified(){return evidenceVerified;} public ClaimReviewStatus getReviewStatus(){return reviewStatus;} public String getReviewer(){return reviewer;} public String getReviewNote(){return reviewNote;} public Instant getReviewedAt(){return reviewedAt;}
}
