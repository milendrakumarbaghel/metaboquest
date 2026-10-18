package org.springboot.backend.domain;

public final class DomainTypes {
    private DomainTypes() {}
    public enum PaperSourceType { PDF, URL }
    public enum PaperStatus { INGESTED, GENERATED, FAILED }
    public enum PackageStatus { AWAITING_REVIEW, CHANGES_REQUESTED, APPROVED, REJECTED }
    public enum ClaimReviewStatus { PENDING, APPROVED, REJECTED }
    public enum AssetType { CAROUSEL, STATIC, REEL, CAPTION }
    public enum AssetStatus { DRAFT, APPROVED, REJECTED }
    public enum ReviewAction { CLAIM_APPROVED, CLAIM_REJECTED, PACKAGE_APPROVED, PACKAGE_REJECTED, CHANGES_REQUESTED }
    public enum BatchStatus { RUNNING, COMPLETED, PARTIAL_FAILURE, FAILED }
}
