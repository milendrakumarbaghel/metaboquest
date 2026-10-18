package org.springboot.backend.repository;
import org.springboot.backend.domain.ContentPackage;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;
public interface ContentPackageRepository extends JpaRepository<ContentPackage, UUID> {
    @Query("select p from ContentPackage p join fetch p.paper where p.id=:id") Optional<ContentPackage> findDetailed(@Param("id") UUID id);
}
