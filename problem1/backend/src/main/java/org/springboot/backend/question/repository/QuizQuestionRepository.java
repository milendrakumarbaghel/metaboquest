package org.springboot.backend.question.repository;

import org.springboot.backend.common.DomainEnums.ReviewStatus;
import org.springboot.backend.question.entity.QuizQuestion;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, UUID> {
    @Query("select distinct q from QuizQuestion q left join fetch q.options left join fetch q.sources " +
           "where q.questionSet.id = :setId and q.active = true and q.reviewStatus = :status order by q.displayOrder")
    List<QuizQuestion> findPublished(@Param("setId") UUID setId, @Param("status") ReviewStatus status);
}
