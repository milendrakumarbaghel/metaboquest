package org.springboot.backend.repository;
import org.springboot.backend.domain.ContentAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ContentAssetRepository extends JpaRepository<ContentAsset, UUID> { List<ContentAsset> findByContentPackageIdOrderByAssetTypeAsc(UUID packageId); }
