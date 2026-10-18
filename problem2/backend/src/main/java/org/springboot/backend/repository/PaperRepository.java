package org.springboot.backend.repository;
import org.springboot.backend.domain.Paper;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface PaperRepository extends JpaRepository<Paper, UUID> { Optional<Paper> findBySha256(String sha256); }
