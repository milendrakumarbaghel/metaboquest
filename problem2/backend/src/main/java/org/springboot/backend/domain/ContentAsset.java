package org.springboot.backend.domain;

import tools.jackson.databind.JsonNode;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;
import static org.springboot.backend.domain.DomainTypes.*;

@Entity @Table(name="content_assets")
public class ContentAsset {
    @Id private UUID id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="package_id") private ContentPackage contentPackage;
    @Enumerated(EnumType.STRING) @Column(name="asset_type", nullable=false) private AssetType assetType;
    @Column(nullable=false, length=300) private String title;
    @JdbcTypeCode(SqlTypes.JSON) @Column(nullable=false, columnDefinition="jsonb") private JsonNode payload;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name="claim_ids", nullable=false, columnDefinition="jsonb") private JsonNode claimIds;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private AssetStatus status;
    @Column(name="created_at", nullable=false) private Instant createdAt;
    @Column(name="updated_at", nullable=false) private Instant updatedAt;
    protected ContentAsset() {}
    public ContentAsset(UUID id,ContentPackage contentPackage,AssetType type,String title,JsonNode payload,JsonNode claimIds,Instant now){this.id=id;this.contentPackage=contentPackage;this.assetType=type;this.title=title;this.payload=payload;this.claimIds=claimIds;this.status=AssetStatus.DRAFT;this.createdAt=now;this.updatedAt=now;}
    public void status(AssetStatus value,Instant now){status=value;updatedAt=now;}
    public UUID getId(){return id;} public ContentPackage getContentPackage(){return contentPackage;} public AssetType getAssetType(){return assetType;} public String getTitle(){return title;} public JsonNode getPayload(){return payload;} public JsonNode getClaimIds(){return claimIds;} public AssetStatus getStatus(){return status;}
}
