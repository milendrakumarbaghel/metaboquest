package org.springboot.backend.repository;
import org.springboot.backend.domain.BatchRun;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface BatchRunRepository extends JpaRepository<BatchRun, UUID> { }
