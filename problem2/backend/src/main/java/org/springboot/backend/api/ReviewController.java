package org.springboot.backend.api;

import jakarta.validation.Valid;
import org.springboot.backend.domain.*;
import org.springboot.backend.pipeline.PipelineService;
import org.springboot.backend.review.ReviewService;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import static org.springboot.backend.api.ApiDtos.*;

@RestController @RequestMapping("/api/v1/review/packages")
public class ReviewController {
    private final ReviewService review;private final PipelineService pipeline;
    public ReviewController(ReviewService review,PipelineService pipeline){this.review=review;this.pipeline=pipeline;}
    @PostMapping("/{packageId}/claims/{claimId}") ClaimView claim(@PathVariable UUID packageId,@PathVariable UUID claimId,@Valid @RequestBody ClaimReviewRequest request){return ApiDtos.claim(review.reviewClaim(packageId,claimId,request.approved(),request.actor(),request.note()));}
    @PostMapping("/{packageId}") PackageView pack(@PathVariable UUID packageId,@Valid @RequestBody PackageReviewRequest request){review.reviewPackage(packageId,request.decision(),request.actor(),request.note());ContentPackage p=pipeline.get(packageId);List<ClaimView> claims=pipeline.claims(packageId).stream().map(ApiDtos::claim).toList();List<AssetView> assets=pipeline.assets(packageId).stream().map(ApiDtos::asset).toList();return new PackageView(p.getId(),ApiDtos.paper(p.getPaper()),p.getLanguage(),p.getAudience(),p.getCoreMessage(),p.getReasoning(),p.getStatus(),p.getAiProvider(),p.getPromptVersion(),p.getEstimatedHumanMinutes(),p.getStatus()==org.springboot.backend.domain.DomainTypes.PackageStatus.APPROVED,claims,assets,p.getCreatedAt());}
}
