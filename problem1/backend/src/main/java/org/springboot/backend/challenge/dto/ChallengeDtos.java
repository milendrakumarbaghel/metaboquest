package org.springboot.backend.challenge.dto;

import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.UUID;

public final class ChallengeDtos {
    private ChallengeDtos() { }
    public record CreateChallengeRequest(@NotNull UUID attemptId, @NotBlank @Size(max=100) String resultToken) { }
    public record ChallengeResponse(String challengeCode, String challengeUrl, int creatorScore, Instant expiresAt) { }
    public record PublicChallengeResponse(String challengeCode, int creatorScore, String achievement, String message, boolean active) { }
}
