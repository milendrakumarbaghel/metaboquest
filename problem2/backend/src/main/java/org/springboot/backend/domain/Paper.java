package org.springboot.backend.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import static org.springboot.backend.domain.DomainTypes.*;

@Entity @Table(name = "papers")
public class Paper {
    @Id private UUID id;
    @Column(nullable=false, length=500) private String title;
    @Enumerated(EnumType.STRING) @Column(name="source_type", nullable=false) private PaperSourceType sourceType;
    @Column(name="source_url", length=1500) private String sourceUrl;
    @Column(name="file_name", length=500) private String fileName;
    @Column(name="content_type", nullable=false, length=100) private String contentType;
    @Basic(fetch=FetchType.LAZY) @Column(name="source_content", nullable=false) private byte[] sourceContent;
    @Column(nullable=false, length=64, unique=true) private String sha256;
    @Column(name="raw_text", nullable=false, columnDefinition="text") private String rawText;
    @Column(name="page_count", nullable=false) private int pageCount;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private PaperStatus status;
    @Column(name="failure_reason", length=1000) private String failureReason;
    @Column(name="created_at", nullable=false) private Instant createdAt;
    @Column(name="updated_at", nullable=false) private Instant updatedAt;
    protected Paper() {}
    public Paper(UUID id, String title, PaperSourceType sourceType, String sourceUrl, String fileName, String contentType, byte[] sourceContent, String sha256, String rawText, int pageCount, Instant now) {
        this.id=id; this.title=title; this.sourceType=sourceType; this.sourceUrl=sourceUrl; this.fileName=fileName; this.contentType=contentType; this.sourceContent=sourceContent.clone(); this.sha256=sha256; this.rawText=rawText; this.pageCount=pageCount; this.status=PaperStatus.INGESTED; this.createdAt=now; this.updatedAt=now;
    }
    public void generated(Instant now) { status=PaperStatus.GENERATED; updatedAt=now; failureReason=null; }
    public void failed(String reason, Instant now) { status=PaperStatus.FAILED; failureReason=reason; updatedAt=now; }
    public UUID getId(){return id;} public String getTitle(){return title;} public PaperSourceType getSourceType(){return sourceType;} public String getSourceUrl(){return sourceUrl;} public String getFileName(){return fileName;} public String getContentType(){return contentType;} public byte[] getSourceContent(){return sourceContent.clone();} public String getSha256(){return sha256;} public String getRawText(){return rawText;} public int getPageCount(){return pageCount;} public PaperStatus getStatus(){return status;} public String getFailureReason(){return failureReason;} public Instant getCreatedAt(){return createdAt;} public Instant getUpdatedAt(){return updatedAt;}
}
