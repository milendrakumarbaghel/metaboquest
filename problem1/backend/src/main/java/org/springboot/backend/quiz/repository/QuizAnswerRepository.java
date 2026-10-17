package org.springboot.backend.quiz.repository;

import org.springboot.backend.quiz.entity.QuizAnswer;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface QuizAnswerRepository extends JpaRepository<QuizAnswer, UUID> {
    interface QuestionPerformance {
        UUID getQuestionId();
        String getQuestionText();
        long getIncorrectAnswers();
        long getTotalAnswers();
    }

    @Query("select distinct a from QuizAnswer a join fetch a.question q left join fetch q.sources where a.attempt.id = :attemptId order by q.displayOrder")
    List<QuizAnswer> findDetailedByAttemptId(@Param("attemptId") UUID attemptId);

    @Query(value = """
            SELECT qa.question_id AS "questionId", q.question_text AS "questionText",
                   COUNT(*) FILTER (WHERE qa.is_correct = FALSE) AS "incorrectAnswers",
                   COUNT(*) AS "totalAnswers"
            FROM quiz_answers qa
            JOIN quiz_questions q ON q.id = qa.question_id
            GROUP BY qa.question_id, q.question_text
            """, nativeQuery = true)
    List<QuestionPerformance> findQuestionPerformance();
}
