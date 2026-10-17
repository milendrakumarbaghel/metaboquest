package org.springboot.backend.analytics.entity;

import org.springboot.backend.common.DomainEnums.AnalyticsEventType;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "analytics_events")
public class AnalyticsEvent {
    @Id private UUID id;
    @Column(name = "session_id") private UUID sessionId;
    @Enumerated(EnumType.STRING) @Column(name = "event_type", nullable = false) private AnalyticsEventType eventType;
    @Column(name = "event_time", nullable = false) private Instant eventTime;
    @JdbcTypeCode(SqlTypes.JSON) @Column(nullable = false, columnDefinition = "jsonb") private String metadata;
    protected AnalyticsEvent() { }
    public AnalyticsEvent(UUID id, UUID sessionId, AnalyticsEventType type, Instant time, String metadata) {
        this.id=id; this.sessionId=sessionId; this.eventType=type; this.eventTime=time; this.metadata=metadata;
    }
}
