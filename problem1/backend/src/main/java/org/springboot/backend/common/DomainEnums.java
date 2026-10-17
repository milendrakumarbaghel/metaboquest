package org.springboot.backend.common;

public final class DomainEnums {
    private DomainEnums() { }

    public enum QuestionType { MYTH_OR_FACT, MULTIPLE_CHOICE, SCENARIO_BASED }
    public enum QuestionCategory { GLP1_AWARENESS, METABOLIC_HEALTH, TREATMENT_SAFETY, HEALTHY_HABITS, DOCTOR_LED_CARE, NUTRITION }
    public enum Difficulty { EASY, MEDIUM, HARD }
    public enum ReviewStatus { DRAFT, APPROVED, REJECTED }
    public enum SourceType { GOVERNMENT_GUIDANCE, PEER_REVIEWED_RESEARCH, CLINICAL_GUIDANCE, ORGANIZATION_WEBSITE }
    public enum SessionStatus { STARTED, COMPLETED, EXPIRED }
    public enum ProfileType { CURIOUS_EXPLORER, SMART_STRATEGIST, MYTH_BUSTER }
    public enum AnalyticsEventType { GAME_STARTED, QUESTION_ANSWERED, GAME_COMPLETED, RESULT_SHARED, FRIEND_CHALLENGE_CREATED, FRIEND_CHALLENGE_OPENED, CTA_CLICKED }
}
