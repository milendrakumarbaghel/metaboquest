package org.springboot.backend.quiz.repository;

import org.springboot.backend.quiz.entity.QuizSession;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;

public interface QuizSessionRepository extends JpaRepository<QuizSession, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from QuizSession s join fetch s.questionSet where s.id = :id")
    Optional<QuizSession> findByIdForUpdate(@Param("id") UUID id);
    @Query("select s from QuizSession s join fetch s.questionSet where s.id = :id")
    Optional<QuizSession> findDetailedById(@Param("id") UUID id);
}
