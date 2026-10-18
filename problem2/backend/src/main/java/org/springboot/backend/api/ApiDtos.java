package org.springboot.backend.api;

import tools.jackson.databind.JsonNode;
import jakarta.validation.constraints.*;
import org.springboot.backend.domain.*;
import org.springboot.backend.domain.DomainTypes.*;
import org.springboot.backend.social.SocialSchedulingService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

public final class ApiDtos {
    private ApiDtos(){}

    public record UrlIngestRequest(@NotBlank @Size(max=1500) String url, @Size(max=500) String title){}
    public record GenerateRequest(@Pattern(regexp="en|hi|hinglish",message="must be en, hi or hinglish") String language, @Size(max=500) String audience){}
    public record BatchRequest(@NotNull @Size(min=1,max=20) List<@NotNull UUID> paperIds, @Pattern(regexp="en|hi|hinglish") String language, @Size(max=500) String audience){}
    public record ClaimReviewRequest(boolean approved, @NotBlank @Size(max=200) String actor, @Size(max=1000) String note){}
    public record PackageReviewRequest(@NotNull PackageStatus decision, @NotBlank @Size(max=200) String actor, @Size(max=1000) String note){}

    public record SchedulePostRequest(
            @NotNull SocialSchedulingService.Platform platform,
            @NotNull Instant scheduledFor,
            String caption,
            List<String> hashtags,
            String mediaFormat
    ){}

    public record PaperView(UUID id, String title, PaperSourceType sourceType, String sourceUrl, String fileName, String sourceDownloadUrl, int pageCount, PaperStatus status, String failureReason, Instant createdAt){}
    public record ClaimView(UUID id, String claimText, String plainLanguage, String evidenceQuote, int pageNumber, String section, BigDecimal confidence, boolean evidenceVerified, ClaimReviewStatus reviewStatus, String reviewer, String reviewNote, Instant reviewedAt){}
    public record AssetView(UUID id, AssetType type, String title, JsonNode payload, JsonNode claimIds, AssetStatus status){}
    public record PackageView(UUID id, PaperView paper, String language, String audience, String coreMessage, String reasoning, PackageStatus status, String aiProvider, String promptVersion, int estimatedHumanMinutes, boolean readyForApproval, List<ClaimView> claims, List<AssetView> assets, Instant createdAt){}
    public record BatchView(UUID id, BatchStatus status, int requestedCount, int completedCount, int failedCount, JsonNode packageIds, JsonNode errors, Instant createdAt, Instant completedAt){}

    public record ScheduledPostView(
            UUID id,
            UUID packageId,
            SocialSchedulingService.Platform platform,
            Instant scheduledFor,
            SocialSchedulingService.ScheduleStatus status,
            String caption,
            List<String> hashtags,
            String mediaFormat,
            JsonNode metaGraphPayload,
            String metaPublishedId,
            Instant publishedAt,
            Instant createdAt
    ){}

    public record HumanEffortView(
            double ingestSeconds,
            double extractionSeconds,
            double reviewSeconds,
            double exportSeconds,
            double totalHumanSeconds,
            double manualBaselineSeconds,
            double timeSavedPercentage
    ){}

    public static PaperView paper(Paper p){return new PaperView(p.getId(),p.getTitle(),p.getSourceType(),p.getSourceUrl(),p.getFileName(),"/api/v1/papers/"+p.getId()+"/source",p.getPageCount(),p.getStatus(),p.getFailureReason(),p.getCreatedAt());}
    public static ClaimView claim(Claim c){return new ClaimView(c.getId(),c.getClaimText(),c.getPlainLanguage(),c.getEvidenceQuote(),c.getPageNumber(),c.getSectionName(),c.getConfidence(),c.isEvidenceVerified(),c.getReviewStatus(),c.getReviewer(),c.getReviewNote(),c.getReviewedAt());}
    public static AssetView asset(ContentAsset a){return new AssetView(a.getId(),a.getAssetType(),a.getTitle(),a.getPayload(),a.getClaimIds(),a.getStatus());}
    public static BatchView batch(BatchRun b){return new BatchView(b.getId(),b.getStatus(),b.getRequestedCount(),b.getCompletedCount(),b.getFailedCount(),b.getPackageIds(),b.getErrors(),b.getCreatedAt(),b.getCompletedAt());}
    public static ScheduledPostView schedule(SocialSchedulingService.ScheduledPost s){
        return new ScheduledPostView(s.id(), s.packageId(), s.platform(), s.scheduledFor(), s.status(), s.caption(), s.hashtags(), s.mediaFormat(), s.metaGraphPayload(), s.metaPublishedId(), s.publishedAt(), s.createdAt());
    }
}
