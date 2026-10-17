package org.springboot.backend.challenge.repository;

import org.springboot.backend.challenge.entity.FriendChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface FriendChallengeRepository extends JpaRepository<FriendChallenge, UUID> {
    Optional<FriendChallenge> findByChallengeCode(String challengeCode);
}
