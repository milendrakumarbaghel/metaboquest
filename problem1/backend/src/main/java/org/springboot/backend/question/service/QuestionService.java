package org.springboot.backend.question.service;

import org.springboot.backend.common.DomainEnums.ReviewStatus;
import org.springboot.backend.common.exception.ApiException;
import org.springboot.backend.question.entity.*;
import org.springboot.backend.question.repository.*;
import org.springboot.backend.quiz.dto.QuizDtos.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class QuestionService {
    private final QuestionSetRepository setRepository;
    private final QuizQuestionRepository questionRepository;

    public QuestionService(QuestionSetRepository setRepository, QuizQuestionRepository questionRepository) {
        this.setRepository = setRepository; this.questionRepository = questionRepository;
    }

    @Transactional(readOnly = true)
    public QuestionSet activeSet() {
        return setRepository.findFirstByActiveTrueOrderByVersionDesc()
                .orElseThrow(() -> ApiException.notFound("No active question set is available"));
    }

    @Transactional(readOnly = true)
    public List<QuizQuestion> publishedQuestions(UUID setId) {
        List<QuizQuestion> questions = questionRepository.findPublished(setId, ReviewStatus.APPROVED);
        if (questions.isEmpty()) throw ApiException.notFound("No approved questions are available");
        if (questions.stream().anyMatch(q -> q.getSources().isEmpty())) {
            throw new IllegalStateException("Published question is missing a medical source");
        }
        return questions;
    }

    public QuestionsResponse publicResponse(int version, List<QuizQuestion> questions) {
        List<QuestionResponse> items = questions.stream().map(q -> new QuestionResponse(
                q.getId(), q.getQuestionType(), q.getCategory(), q.getQuestionText(),
                q.getOptions().stream().map(o -> new OptionResponse(o.getId(), o.getOptionText())).toList())).toList();
        return new QuestionsResponse(version, items.size(), items);
    }
}
