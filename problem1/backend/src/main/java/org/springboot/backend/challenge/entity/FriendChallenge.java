package org.springboot.backend.challenge.entity;

import org.springboot.backend.quiz.entity.QuizAttempt;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "friend_challenges")
public class FriendChallenge {
    @Id private UUID id;
    @Column(name = "challenge_code", nullable = false, unique = true, length = 32) private String challengeCode;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "creator_attempt_id") private QuizAttempt creatorAttempt;
    @Column(name = "creator_score", nullable = false) private int creatorScore;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(nullable = false) private boolean active;
    protected FriendChallenge() { }
    public FriendChallenge(UUID id, String code, QuizAttempt attempt, Instant now, Instant expiresAt) {
        this.id=id; this.challengeCode=code; this.creatorAttempt=attempt; this.creatorScore=attempt.getScore();
        this.createdAt=now; this.expiresAt=expiresAt; this.active=true;
    }
    public String getChallengeCode() { return challengeCode; }
    public int getCreatorScore() { return creatorScore; }
    public Instant getExpiresAt() { return expiresAt; }
    public boolean isActive() { return active; }
    public boolean isUsable(Instant now) { return active && expiresAt.isAfter(now); }
}
