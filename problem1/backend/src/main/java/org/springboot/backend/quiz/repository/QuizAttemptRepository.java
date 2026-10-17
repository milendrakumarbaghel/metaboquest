package org.springboot.backend.quiz.repository;

import org.springboot.backend.quiz.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, UUID> {
    Optional<QuizAttempt> findBySessionId(UUID sessionId);
}
