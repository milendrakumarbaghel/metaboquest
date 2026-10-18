package org.springboot.backend.review;

import org.springboot.backend.common.ApiException;
import org.springboot.backend.domain.*;
import org.springboot.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
import static org.springboot.backend.domain.DomainTypes.*;

@Service
public class ReviewService {
    private final ContentPackageRepository packages;private final ClaimRepository claims;private final ContentAssetRepository assets;private final ReviewEventRepository events;private final Clock clock;
    public ReviewService(ContentPackageRepository packages,ClaimRepository claims,ContentAssetRepository assets,ReviewEventRepository events,Clock clock){this.packages=packages;this.claims=claims;this.assets=assets;this.events=events;this.clock=clock;}
    @Transactional public Claim reviewClaim(UUID packageId,UUID claimId,boolean approved,String actor,String note){
        ContentPackage pack=pack(packageId);Claim claim=claims.findByIdAndContentPackageId(claimId,packageId).orElseThrow(()->ApiException.notFound("Claim not found in this package"));
        if(!approved&&(note==null||note.isBlank()))throw ApiException.badRequest("A rejection note is required");Instant now=clock.instant();
        claim.review(approved?ClaimReviewStatus.APPROVED:ClaimReviewStatus.REJECTED,actor,note,now);pack.status(approved?PackageStatus.AWAITING_REVIEW:PackageStatus.CHANGES_REQUESTED,now);
        events.save(new ReviewEvent(UUID.randomUUID(),pack,claim,approved?ReviewAction.CLAIM_APPROVED:ReviewAction.CLAIM_REJECTED,actor,note,now));return claim;
    }
    @Transactional public ContentPackage reviewPackage(UUID packageId,PackageStatus decision,String actor,String note){
        if(decision!=PackageStatus.APPROVED&&decision!=PackageStatus.REJECTED&&decision!=PackageStatus.CHANGES_REQUESTED)throw ApiException.badRequest("Invalid package review decision");
        ContentPackage pack=pack(packageId);Instant now=clock.instant();
        if(decision==PackageStatus.APPROVED&&claims.countByContentPackageIdAndReviewStatusNot(packageId,ClaimReviewStatus.APPROVED)>0)throw ApiException.conflict("Every claim must be approved before package approval");
        if(decision!=PackageStatus.APPROVED&&(note==null||note.isBlank()))throw ApiException.badRequest("A review note is required");
        pack.status(decision,now);assets.findByContentPackageIdOrderByAssetTypeAsc(packageId).forEach(a->a.status(decision==PackageStatus.APPROVED?AssetStatus.APPROVED:AssetStatus.REJECTED,now));
        ReviewAction action=decision==PackageStatus.APPROVED?ReviewAction.PACKAGE_APPROVED:decision==PackageStatus.REJECTED?ReviewAction.PACKAGE_REJECTED:ReviewAction.CHANGES_REQUESTED;
        events.save(new ReviewEvent(UUID.randomUUID(),pack,null,action,actor,note,now));return pack;
    }
    private ContentPackage pack(UUID id){return packages.findById(id).orElseThrow(()->ApiException.notFound("Content package not found"));}
}
