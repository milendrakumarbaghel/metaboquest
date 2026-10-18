package org.springboot.backend.repository;
import org.springboot.backend.domain.*;
import org.springboot.backend.domain.DomainTypes.ClaimReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ClaimRepository extends JpaRepository<Claim, UUID> {
    List<Claim> findByContentPackageIdOrderByPageNumberAsc(UUID packageId);
    long countByContentPackageIdAndReviewStatusNot(UUID packageId, ClaimReviewStatus status);
    Optional<Claim> findByIdAndContentPackageId(UUID id,UUID packageId);
}
