package org.springboot.backend.analytics.repository;

import org.springboot.backend.analytics.entity.AnalyticsEvent;
import org.springboot.backend.common.DomainEnums.AnalyticsEventType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, UUID> {
    long countByEventType(AnalyticsEventType eventType);
}
