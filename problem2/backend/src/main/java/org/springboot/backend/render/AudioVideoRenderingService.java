package org.springboot.backend.render;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springboot.backend.common.ApiException;
import org.springboot.backend.domain.ContentAsset;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class AudioVideoRenderingService {

    private final ObjectMapper mapper;

    public AudioVideoRenderingService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public byte[] generateVoiceoverAudioWav(ContentAsset reelAsset) {
        JsonNode payload = reelAsset.getPayload();
        int totalSeconds = Math.max(15, Math.min(60, payload.path("totalSeconds").asInt(30)));
        int sampleRate = 44100;
        int totalSamples = sampleRate * totalSeconds;

        byte[] pcmData = new byte[totalSamples * 2]; // 16-bit mono
        double twoPi = 2.0 * Math.PI;

        // Warm ambient harmonic drone + narrator speech simulation
        for (int i = 0; i < totalSamples; i++) {
            double t = (double) i / sampleRate;

            // Ambient background chord (calm Steer tone: C major add9 / 261.6Hz + 329.6Hz + 392.0Hz + 587.3Hz)
            double bgChord = 0.08 * (
                    Math.sin(twoPi * 130.81 * t) +
                    0.7 * Math.sin(twoPi * 196.00 * t) +
                    0.5 * Math.sin(twoPi * 261.63 * t) +
                    0.3 * Math.sin(twoPi * 392.00 * t)
            );

            // Speech cadence modulation (pulsing like human voiceover phrases during active speaking intervals)
            double speechEnv = 0.5 + 0.5 * Math.sin(twoPi * 3.2 * t);
            double voiceFundamental = Math.sin(twoPi * 145.0 * t) + 0.5 * Math.sin(twoPi * 290.0 * t) + 0.25 * Math.sin(twoPi * 435.0 * t);
            double speechSignal = 0.28 * speechEnv * voiceFundamental;

            // Fade in and fade out
            double envelope = 1.0;
            if (t < 0.5) envelope = t / 0.5;
            else if (t > totalSeconds - 1.0) envelope = Math.max(0, (totalSeconds - t));

            double sample = (bgChord + speechSignal) * envelope;
            sample = Math.max(-1.0, Math.min(1.0, sample));
            short pcmVal = (short) (sample * 32767);

            pcmData[i * 2] = (byte) (pcmVal & 0xff);
            pcmData[i * 2 + 1] = (byte) ((pcmVal >> 8) & 0xff);
        }

        return createWavFile(pcmData, sampleRate, 1, 16);
    }

    public String generateSubtitlesSrt(ContentAsset reelAsset) {
        JsonNode scenes = reelAsset.getPayload().path("scenes");
        StringBuilder sb = new StringBuilder();
        int counter = 1;
        double currentStartSec = 0.0;

        if (scenes.isArray() && !scenes.isEmpty()) {
            for (JsonNode scene : scenes) {
                String subtitle = scene.path("subtitle").asText(scene.path("voiceover").asText(""));
                double duration = parseDuration(scene.path("time").asText("0-5s"));
                double endSec = currentStartSec + duration;

                sb.append(counter++).append("\n");
                sb.append(formatSrtTime(currentStartSec)).append(" --> ").append(formatSrtTime(endSec)).append("\n");
                sb.append(subtitle).append("\n\n");

                currentStartSec = endSec;
            }
        } else {
            String hook = reelAsset.getPayload().path("hook").asText("Research, made simpler.");
            sb.append("1\n00:00:00,000 --> 00:00:04,000\n").append(hook).append("\n\n");
            sb.append("2\n00:00:04,000 --> 00:00:24,000\n").append("Metabolic health is biology, not willpower.\n\n");
            sb.append("3\n00:00:24,000 --> 00:00:30,000\n").append("Talk to a Steer doctor at steerclub.com\n\n");
        }
        return sb.toString();
    }

    public String generateSubtitlesVtt(ContentAsset reelAsset) {
        String srt = generateSubtitlesSrt(reelAsset);
        String vtt = "WEBVTT - Steer Science Studio Reel Subtitles\n\n" + srt.replaceAll(",", ".");
        return vtt;
    }

    public BufferedImage renderReelSceneFrame(ContentAsset reelAsset, int sceneIndex, int width, int height) {
        JsonNode payload = reelAsset.getPayload();
        JsonNode scenes = payload.path("scenes");
        if (sceneIndex < 0 || (scenes.isArray() && sceneIndex >= scenes.size())) {
            sceneIndex = 0;
        }

        JsonNode scene = scenes.isArray() && scenes.size() > sceneIndex ? scenes.get(sceneIndex) : payload;
        String timeTag = scene.path("time").asText("0-5s");
        String visual = scene.path("visual").asText("Paper findings simplified");
        String voiceover = scene.path("voiceover").asText(payload.path("hook").asText(""));
        String subtitle = scene.path("subtitle").asText("");
        String paperTitle = reelAsset.getContentPackage().getPaper().getTitle();

        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

        // Background: 9:16 vertical styling
        g.setColor(ImageRenderingService.COLOR_CREAM);
        g.fillRect(0, 0, width, height);

        // Header overlay (Safe area for Instagram Reels)
        int safeTop = (int) (height * 0.10);
        g.setColor(ImageRenderingService.COLOR_RUST);
        g.setFont(new Font("Serif", Font.BOLD, (int) (width * 0.055)));
        g.drawString("steer", (int) (width * 0.08), safeTop);

        g.setColor(ImageRenderingService.COLOR_CLAY);
        g.setFont(new Font("SansSerif", Font.BOLD, (int) (width * 0.024)));
        g.drawString("RESEARCH REEL • " + timeTag, (int) (width * 0.25), safeTop - 4);

        // Video Progress Line
        g.setColor(ImageRenderingService.COLOR_BLUSH);
        g.fillRect((int) (width * 0.08), safeTop + 24, (int) (width * 0.84), 6);
        g.setColor(ImageRenderingService.COLOR_RUST);
        int progressW = (int) ((width * 0.84) * ((double) (sceneIndex + 1) / Math.max(1, scenes.size())));
        g.fillRect((int) (width * 0.08), safeTop + 24, progressW, 6);

        // Main Center Editorial Card
        int cardY = (int) (height * 0.22);
        int cardH = (int) (height * 0.54);
        int cardW = (int) (width * 0.86);
        int cardX = (int) (width * 0.07);

        g.setColor(ImageRenderingService.COLOR_SOFT_PAPER);
        g.fillRoundRect(cardX, cardY, cardW, cardH, 36, 36);
        g.setColor(ImageRenderingService.COLOR_BLUSH);
        g.setStroke(new BasicStroke(2f));
        g.drawRoundRect(cardX, cardY, cardW, cardH, 36, 36);

        // Scene Badge
        g.setColor(ImageRenderingService.COLOR_MAROON);
        g.fillRoundRect(cardX + 45, cardY + 50, (int) (width * 0.26), (int) (height * 0.028), 16, 16);
        g.setColor(Color.WHITE);
        g.setFont(new Font("SansSerif", Font.BOLD, (int) (width * 0.020)));
        g.drawString("SCENE " + (sceneIndex + 1), cardX + 65, cardY + 50 + (int) (height * 0.019));

        // Subtitle / Spoken headline
        g.setColor(ImageRenderingService.COLOR_RUST);
        g.setFont(new Font("Serif", Font.BOLD, (int) (width * 0.056)));
        int textY = drawWrapped(g, subtitle.isBlank() ? voiceover : subtitle, cardX + 45, cardY + 140, cardW - 90, (int) (width * 0.068), 5);

        // Voiceover Script Preview
        g.setColor(ImageRenderingService.COLOR_INK);
        g.setFont(new Font("SansSerif", Font.PLAIN, (int) (width * 0.030)));
        drawWrapped(g, "\"" + voiceover + "\"", cardX + 45, textY + 40, cardW - 90, (int) (width * 0.042), 5);

        // Visual / B-Roll Director Instruction Box
        int bRollBoxY = cardY + cardH - (int) (height * 0.16);
        g.setColor(ImageRenderingService.COLOR_CREAM);
        g.fillRoundRect(cardX + 35, bRollBoxY, cardW - 70, (int) (height * 0.12), 20, 20);
        g.setColor(ImageRenderingService.COLOR_CLAY);
        g.setFont(new Font("SansSerif", Font.BOLD, (int) (width * 0.020)));
        g.drawString("CAMERA & B-ROLL DIRECTION", cardX + 55, bRollBoxY + 30);
        g.setColor(ImageRenderingService.COLOR_INK);
        g.setFont(new Font("SansSerif", Font.ITALIC, (int) (width * 0.024)));
        drawWrapped(g, visual, cardX + 55, bRollBoxY + 62, cardW - 110, (int) (width * 0.032), 2);

        // Soundwave simulator (animated aesthetic wave)
        int waveY = (int) (height * 0.81);
        g.setColor(ImageRenderingService.COLOR_RUST);
        for (int i = 0; i < 28; i++) {
            int barH = (int) (20 + 35 * Math.abs(Math.sin((i + sceneIndex * 4) * 0.4)));
            int barX = (int) (width * 0.15) + (i * 26);
            g.fillRoundRect(barX, waveY - (barH / 2), 12, barH, 6, 6);
        }

        // Subtitle Karaoke Banner at Bottom (Safe above Instagram Reel captions)
        int subBoxY = (int) (height * 0.85);
        g.setColor(new Color(0x35, 0x1D, 0x1D, 220));
        g.fillRoundRect((int) (width * 0.08), subBoxY, (int) (width * 0.84), (int) (height * 0.06), 24, 24);
        g.setColor(Color.WHITE);
        g.setFont(new Font("SansSerif", Font.BOLD, (int) (width * 0.028)));
        String shortSub = subtitle.length() > 50 ? subtitle.substring(0, 48) + "..." : subtitle;
        g.drawString(shortSub, (int) (width * 0.12), subBoxY + (int) (height * 0.038));

        g.dispose();
        return img;
    }

    public byte[] renderReelFramePng(ContentAsset reelAsset, int sceneIndex, int width, int height) {
        BufferedImage img = renderReelSceneFrame(reelAsset, sceneIndex, width, height);
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(img, "PNG", baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to encode frame PNG", e);
        }
    }

    public byte[] renderReelZip(ContentAsset reelAsset) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(baos)) {

            // 1. Voiceover Audio
            byte[] wav = generateVoiceoverAudioWav(reelAsset);
            zos.putNextEntry(new ZipEntry("voiceover_audio.wav"));
            zos.write(wav);
            zos.closeEntry();

            // 2. Subtitles (.srt and .vtt)
            String srt = generateSubtitlesSrt(reelAsset);
            zos.putNextEntry(new ZipEntry("subtitles.srt"));
            zos.write(srt.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            String vtt = generateSubtitlesVtt(reelAsset);
            zos.putNextEntry(new ZipEntry("subtitles.vtt"));
            zos.write(vtt.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            // 3. Storyboard JSON
            String json = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(reelAsset.getPayload());
            zos.putNextEntry(new ZipEntry("storyboard_specification.json"));
            zos.write(json.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            // 4. B-Roll Prompts text
            StringBuilder bRoll = new StringBuilder("STEER SCIENCE STUDIO — B-ROLL PRODUCTION PROMPTS\n\n");
            JsonNode bRollPrompts = reelAsset.getPayload().path("bRollPrompts");
            if (bRollPrompts.isArray()) {
                int idx = 1;
                for (JsonNode prompt : bRollPrompts) {
                    bRoll.append("B-Roll ").append(idx++).append(": ").append(prompt.asText()).append("\n");
                }
            }
            zos.putNextEntry(new ZipEntry("b_roll_prompts.txt"));
            zos.write(bRoll.toString().getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            // 5. Render Scene Frames (1080x1920)
            JsonNode scenes = reelAsset.getPayload().path("scenes");
            int sceneCount = scenes.isArray() ? scenes.size() : 1;
            for (int i = 0; i < sceneCount; i++) {
                byte[] frame = renderReelFramePng(reelAsset, i, 1080, 1920);
                zos.putNextEntry(new ZipEntry(String.format("scene_%02d_frame.png", i + 1)));
                zos.write(frame);
                zos.closeEntry();
            }

            zos.finish();
            return baos.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to assemble reel zip", e);
        }
    }

    private int drawWrapped(Graphics2D g, String text, int x, int y, int maxWidth, int lineHeight, int maxLines) {
        if (text == null || text.isBlank()) return y;
        FontMetrics fm = g.getFontMetrics();
        String[] words = text.split("\\s+");
        StringBuilder line = new StringBuilder();
        int curY = y;
        int drawn = 0;
        for (String word : words) {
            String test = line.isEmpty() ? word : line + " " + word;
            if (fm.stringWidth(test) > maxWidth) {
                if (!line.isEmpty()) {
                    g.drawString(line.toString(), x, curY);
                    curY += lineHeight;
                    drawn++;
                    if (drawn >= maxLines - 1) {
                        line = new StringBuilder(word + "...");
                        break;
                    }
                }
                line = new StringBuilder(word);
            } else {
                line = new StringBuilder(test);
            }
        }
        if (!line.isEmpty() && drawn < maxLines) {
            g.drawString(line.toString(), x, curY);
            curY += lineHeight;
        }
        return curY;
    }

    private double parseDuration(String timeStr) {
        // e.g. "0-3s" or "3-15s"
        try {
            if (timeStr.contains("-")) {
                String[] parts = timeStr.replace("s", "").trim().split("-");
                double start = Double.parseDouble(parts[0].trim());
                double end = Double.parseDouble(parts[1].trim());
                return Math.max(1.0, end - start);
            }
        } catch (Exception ignored) {}
        return 6.0;
    }

    private String formatSrtTime(double seconds) {
        int hrs = (int) (seconds / 3600);
        int mins = (int) ((seconds % 3600) / 60);
        int secs = (int) (seconds % 60);
        int ms = (int) ((seconds - (int) seconds) * 1000);
        return String.format("%02d:%02d:%02d,%03d", hrs, mins, secs, ms);
    }

    private byte[] createWavFile(byte[] pcmData, int sampleRate, int channels, int bitsPerSample) {
        int totalDataLen = pcmData.length + 36;
        int byteRate = sampleRate * channels * bitsPerSample / 8;
        ByteBuffer buffer = ByteBuffer.allocate(pcmData.length + 44).order(ByteOrder.LITTLE_ENDIAN);

        buffer.put("RIFF".getBytes(StandardCharsets.US_ASCII));
        buffer.putInt(totalDataLen);
        buffer.put("WAVE".getBytes(StandardCharsets.US_ASCII));
        buffer.put("fmt ".getBytes(StandardCharsets.US_ASCII));
        buffer.putInt(16); // Subchunk1Size
        buffer.putShort((short) 1); // AudioFormat PCM
        buffer.putShort((short) channels);
        buffer.putInt(sampleRate);
        buffer.putInt(byteRate);
        buffer.putShort((short) (channels * bitsPerSample / 8));
        buffer.putShort((short) bitsPerSample);
        buffer.put("data".getBytes(StandardCharsets.US_ASCII));
        buffer.putInt(pcmData.length);
        buffer.put(pcmData);

        return buffer.array();
    }
}

