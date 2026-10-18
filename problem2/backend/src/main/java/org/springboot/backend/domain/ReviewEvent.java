package org.springboot.backend.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import static org.springboot.backend.domain.DomainTypes.*;

@Entity @Table(name="review_events")
public class ReviewEvent {
    @Id private UUID id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="package_id") private ContentPackage contentPackage;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="claim_id") private Claim claim;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private ReviewAction action;
    @Column(nullable=false,length=200) private String actor;
    @Column(length=1000) private String note;
    @Column(name="created_at",nullable=false) private Instant createdAt;
    protected ReviewEvent() {}
    public ReviewEvent(UUID id,ContentPackage pack,Claim claim,ReviewAction action,String actor,String note,Instant now){this.id=id;this.contentPackage=pack;this.claim=claim;this.action=action;this.actor=actor;this.note=note;this.createdAt=now;}
}
