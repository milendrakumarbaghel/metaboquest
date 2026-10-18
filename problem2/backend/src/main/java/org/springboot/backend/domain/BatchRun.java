package org.springboot.backend.domain;

import tools.jackson.databind.JsonNode;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;
import static org.springboot.backend.domain.DomainTypes.*;

@Entity @Table(name="batch_runs")
public class BatchRun {
    @Id private UUID id;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private BatchStatus status;
    @Column(name="requested_count",nullable=false) private int requestedCount;
    @Column(name="completed_count",nullable=false) private int completedCount;
    @Column(name="failed_count",nullable=false) private int failedCount;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name="package_ids",nullable=false,columnDefinition="jsonb") private JsonNode packageIds;
    @JdbcTypeCode(SqlTypes.JSON) @Column(nullable=false,columnDefinition="jsonb") private JsonNode errors;
    @Column(name="created_at",nullable=false) private Instant createdAt;
    @Column(name="completed_at") private Instant completedAt;
    protected BatchRun() {}
    public BatchRun(UUID id,int count,JsonNode packageIds,JsonNode errors,Instant now){this.id=id;this.requestedCount=count;this.packageIds=packageIds;this.errors=errors;this.status=BatchStatus.RUNNING;this.createdAt=now;}
    public void finish(int completed,int failed,JsonNode packageIds,JsonNode errors,Instant now){this.completedCount=completed;this.failedCount=failed;this.packageIds=packageIds;this.errors=errors;this.status=failed==0?BatchStatus.COMPLETED:completed==0?BatchStatus.FAILED:BatchStatus.PARTIAL_FAILURE;this.completedAt=now;}
    public UUID getId(){return id;} public BatchStatus getStatus(){return status;} public int getRequestedCount(){return requestedCount;} public int getCompletedCount(){return completedCount;} public int getFailedCount(){return failedCount;} public JsonNode getPackageIds(){return packageIds;} public JsonNode getErrors(){return errors;} public Instant getCreatedAt(){return createdAt;} public Instant getCompletedAt(){return completedAt;}
}
