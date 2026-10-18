package org.springboot.backend.render;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springboot.backend.domain.*;
import org.springboot.backend.domain.DomainTypes.*;

import java.awt.image.BufferedImage;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class RenderingServicesTest {

    private ImageRenderingService imageRenderer;
    private AudioVideoRenderingService avRenderer;
    private ObjectMapper mapper;
    private ContentPackage samplePackage;
    private ContentAsset carouselAsset;
    private ContentAsset staticAsset;
    private ContentAsset reelAsset;

    @BeforeEach
    void setUp() {
        mapper = new ObjectMapper();
        imageRenderer = new ImageRenderingService();
        avRenderer = new AudioVideoRenderingService(mapper);

        Paper paper = new Paper(
                UUID.randomUUID(),
                "STEP 1 Trial Extension: Weight regain after semaglutide",
                PaperSourceType.PDF,
                null,
                "step1_extension.pdf",
                "application/pdf",
                new byte[]{1, 2, 3},
                "sha256hash",
                "Raw paper text",
                12,
                Instant.now()
        );

        samplePackage = new ContentPackage(
                UUID.randomUUID(),
                paper,
                "en",
                "Adults in India exploring metabolic health",
                "Weight regain after stopping medication is biological, not a failure of willpower.",
                "Clinical evidence highlights the chronic nature of metabolic regulation.",
                "extractive-local",
                "steer-v1",
                12,
                Instant.now()
        );

        // Carousel asset
        ObjectNode carouselPayload = mapper.createObjectNode();
        ArrayNode slides = carouselPayload.putArray("slides");
        slides.addObject().put("headline", "Why weight regain happens").put("body", "Understanding the STEP 1 trial extension findings.").put("theme", "maroon");
        slides.addObject().put("headline", "Two-thirds of weight returned").put("body", "One year after withdrawal, participants regained roughly 2/3 of lost weight.");
        slides.addObject().put("headline", "Metabolic markers reverted").put("body", "Blood pressure, HbA1c and lipid levels moved back toward baseline.");
        slides.addObject().put("headline", "Doctor-led care matters").put("body", "Sustainable habits and physician monitoring prevent the rebound effect.");
        carouselAsset = new ContentAsset(UUID.randomUUID(), samplePackage, AssetType.CAROUSEL, "Carousel: STEP 1 Findings", carouselPayload, mapper.createArrayNode(), Instant.now());

        // Static asset
        ObjectNode staticPayload = mapper.createObjectNode()
                .put("headline", "Weight loss is biology, not willpower")
                .put("body", "One year after stopping treatment, patients regained roughly two-thirds of lost weight.")
                .put("footer", "Evidence, without the hype • steerclub.com");
        staticAsset = new ContentAsset(UUID.randomUUID(), samplePackage, AssetType.STATIC, "Static Post", staticPayload, mapper.createArrayNode(), Instant.now());

        // Reel asset
        ObjectNode reelPayload = mapper.createObjectNode()
                .put("hook", "One paper. One crucial metabolic takeaway.")
                .put("totalSeconds", 30)
                .put("musicMood", "warm, minimal, credible");
        ArrayNode scenes = reelPayload.putArray("scenes");
        scenes.addObject().put("time", "0-3s").put("visual", "Paper headline appears").put("voiceover", "Here is what happened when patients stopped GLP-1 treatment.").put("subtitle", "What happens when you stop?");
        scenes.addObject().put("time", "3-15s").put("visual", "Evidence graphic").put("voiceover", "Within one year, two thirds of lost weight returned as hormonal appetite signals adapted.").put("subtitle", "Two-thirds of weight returned");
        scenes.addObject().put("time", "15-30s").put("visual", "Doctor consult and Indian meal scene").put("voiceover", "That is why Steer focuses on long-term habits and doctor supervision.").put("subtitle", "Talk to a Steer doctor");
        reelPayload.putArray("bRollPrompts").add("Chai break at desk").add("Family dinner");
        reelAsset = new ContentAsset(UUID.randomUUID(), samplePackage, AssetType.REEL, "AI Reel Storyboard", reelPayload, mapper.createArrayNode(), Instant.now());
    }

    @Test
    void rendersCarouselSlideAndZipSuccessfully() {
        BufferedImage img = imageRenderer.renderCarouselSlide(carouselAsset, 0, 1080, 1080);
        assertThat(img.getWidth()).isEqualTo(1080);
        assertThat(img.getHeight()).isEqualTo(1080);

        byte[] png = imageRenderer.renderCarouselSlidePng(carouselAsset, 1, 1080, 1350);
        assertThat(png).isNotEmpty();
        assertThat(png.length).isGreaterThan(1000);

        byte[] zip = imageRenderer.renderCarouselZip(carouselAsset, 1080, 1080);
        assertThat(zip).isNotEmpty();
        assertThat(zip.length).isGreaterThan(5000);
    }

    @Test
    void rendersStaticPostInDifferentAspectRatios() {
        byte[] square = imageRenderer.renderStaticPostPng(staticAsset, 1080, 1080);
        assertThat(square).isNotEmpty();

        byte[] portrait = imageRenderer.renderStaticPostPng(staticAsset, 1080, 1350);
        assertThat(portrait).isNotEmpty();

        byte[] story = imageRenderer.renderStaticPostPng(staticAsset, 1080, 1920);
        assertThat(story).isNotEmpty();
    }

    @Test
    void generatesCanvaDesignSpecification() {
        var spec = imageRenderer.generateCanvaDesignSpec(samplePackage);
        assertThat(spec).containsKey("brandColors");
        assertThat(spec).containsKey("typography");
        assertThat(spec).containsKey("templates");
    }

    @Test
    void generatesAudioWavAndSubtitles() {
        byte[] wav = avRenderer.generateVoiceoverAudioWav(reelAsset);
        assertThat(wav).isNotEmpty();
        // Check RIFF header
        assertThat(new String(wav, 0, 4)).isEqualTo("RIFF");
        assertThat(new String(wav, 8, 4)).isEqualTo("WAVE");

        String srt = avRenderer.generateSubtitlesSrt(reelAsset);
        assertThat(srt).contains("-->");
        assertThat(srt).contains("Two-thirds of weight returned");

        String vtt = avRenderer.generateSubtitlesVtt(reelAsset);
        assertThat(vtt).startsWith("WEBVTT");

        byte[] reelZip = avRenderer.renderReelZip(reelAsset);
        assertThat(reelZip).isNotEmpty();
        assertThat(reelZip.length).isGreaterThan(10000);
    }
}

