package org.springboot.backend.question.repository;

import org.springboot.backend.question.entity.QuestionSet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface QuestionSetRepository extends JpaRepository<QuestionSet, UUID> {
    Optional<QuestionSet> findFirstByActiveTrueOrderByVersionDesc();
}
