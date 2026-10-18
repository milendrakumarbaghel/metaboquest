package org.springboot.backend.social;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import org.springboot.backend.common.ApiException;
import org.springboot.backend.domain.ContentPackage;
import org.springboot.backend.domain.DomainTypes.PackageStatus;
import org.springboot.backend.pipeline.PipelineService;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SocialSchedulingService {

    public enum Platform {
        INSTAGRAM_FEED,
        INSTAGRAM_REELS,
        INSTAGRAM_STORIES,
        FACEBOOK
    }

    public enum ScheduleStatus {
        SCHEDULED,
        PUBLISHED,
        FAILED,
        CANCELLED
    }

    public record ScheduledPost(
            UUID id,
            UUID packageId,
            Platform platform,
            Instant scheduledFor,
            ScheduleStatus status,
            String caption,
            List<String> hashtags,
            String mediaFormat,
            JsonNode metaGraphPayload,
            String metaPublishedId,
            Instant publishedAt,
            Instant createdAt
    ) {}

    public record ScheduleCommand(
            Platform platform,
            Instant scheduledFor,
            String customCaption,
            List<String> hashtags,
            String mediaFormat
    ) {}

    private final PipelineService pipeline;
    private final ObjectMapper mapper;
    private final Clock clock;
    private final Map<UUID, ScheduledPost> scheduledStore = new ConcurrentHashMap<>();

    public SocialSchedulingService(PipelineService pipeline, ObjectMapper mapper, Clock clock) {
        this.pipeline = pipeline;
        this.mapper = mapper;
        this.clock = clock;
    }

    public ScheduledPost schedule(UUID packageId, ScheduleCommand cmd) {
        ContentPackage pack = pipeline.get(packageId);
        if (pack.getStatus() != PackageStatus.APPROVED) {
            throw ApiException.conflict("Cannot schedule an unapproved package. Doctor review must approve all claims first.");
        }
        if (cmd.scheduledFor() == null || cmd.scheduledFor().isBefore(clock.instant().minusSeconds(60))) {
            throw ApiException.badRequest("Scheduled time must be in the future");
        }

        UUID scheduleId = UUID.randomUUID();
        String caption = cmd.customCaption() != null && !cmd.customCaption().isBlank()
                ? cmd.customCaption()
                : pack.getCoreMessage() + "\n\nLearn how Steer doctors assess metabolic care: steerclub.com";

        List<String> tags = cmd.hashtags() != null && !cmd.hashtags().isEmpty()
                ? cmd.hashtags()
                : List.of("#MetabolicHealth", "#SteerClub", "#GLP1Facts", "#EvidenceFirst", "#HealthResearch");

        ObjectNode metaPayload = mapper.createObjectNode();
        metaPayload.put("access_token", "EAAX...[SECURE_META_TOKEN]");
        metaPayload.put("caption", caption + "\n\n" + String.join(" ", tags));

        if (cmd.platform() == Platform.INSTAGRAM_REELS) {
            metaPayload.put("media_type", "REELS");
            metaPayload.put("video_url", "https://api.steerclub.com/v1/packages/" + packageId + "/render/reel/video");
            metaPayload.put("share_to_feed", true);
            metaPayload.put("thumb_offset", 1500);
        } else if (cmd.platform() == Platform.INSTAGRAM_FEED) {
            metaPayload.put("media_type", "CAROUSEL");
            ArrayNode children = metaPayload.putArray("children");
            for (int i = 0; i < 6; i++) {
                children.addObject().put("image_url", "https://api.steerclub.com/v1/packages/" + packageId + "/render/carousel/slides/" + i);
            }
        } else {
            metaPayload.put("media_type", "IMAGE");
            metaPayload.put("image_url", "https://api.steerclub.com/v1/packages/" + packageId + "/render/static?format=" + (cmd.mediaFormat() != null ? cmd.mediaFormat() : "portrait"));
        }

        ScheduledPost post = new ScheduledPost(
                scheduleId,
                packageId,
                cmd.platform(),
                cmd.scheduledFor(),
                ScheduleStatus.SCHEDULED,
                caption,
                tags,
                cmd.mediaFormat() != null ? cmd.mediaFormat() : "portrait",
                metaPayload,
                null,
                null,
                clock.instant()
        );

        scheduledStore.put(packageId, post);
        return post;
    }

    public Optional<ScheduledPost> getSchedule(UUID packageId) {
        return Optional.ofNullable(scheduledStore.get(packageId));
    }

    public ScheduledPost triggerPublish(UUID packageId) {
        ScheduledPost existing = scheduledStore.get(packageId);
        if (existing == null) {
            ContentPackage pack = pipeline.get(packageId);
            if (pack.getStatus() != PackageStatus.APPROVED) {
                throw ApiException.conflict("Cannot publish unapproved package");
            }
            // Auto schedule now
            existing = schedule(packageId, new ScheduleCommand(
                    Platform.INSTAGRAM_FEED,
                    clock.instant().plusSeconds(5),
                    pack.getCoreMessage(),
                    List.of("#MetabolicHealth", "#SteerClub"),
                    "portrait"
            ));
        }

        Instant now = clock.instant();
        String simulatedMetaId = "meta_ig_" + Math.abs(UUID.randomUUID().getMostSignificantBits());
        ScheduledPost published = new ScheduledPost(
                existing.id(),
                existing.packageId(),
                existing.platform(),
                existing.scheduledFor(),
                ScheduleStatus.PUBLISHED,
                existing.caption(),
                existing.hashtags(),
                existing.mediaFormat(),
                existing.metaGraphPayload(),
                simulatedMetaId,
                now,
                existing.createdAt()
        );
        scheduledStore.put(packageId, published);
        return published;
    }
}

