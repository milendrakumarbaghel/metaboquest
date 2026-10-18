package org.springboot.backend.repository;
import org.springboot.backend.domain.ReviewEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface ReviewEventRepository extends JpaRepository<ReviewEvent, UUID> { }
