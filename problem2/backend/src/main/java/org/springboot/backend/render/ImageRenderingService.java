package org.springboot.backend.render;

import tools.jackson.databind.JsonNode;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springboot.backend.common.ApiException;
import org.springboot.backend.domain.ContentAsset;
import org.springboot.backend.domain.ContentPackage;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class ImageRenderingService {

    public static final Color COLOR_CREAM = new Color(0xF5, 0xEB, 0xDF);
    public static final Color COLOR_RUST = new Color(0xC0, 0x4E, 0x2A);
    public static final Color COLOR_MAROON = new Color(0x66, 0x14, 0x14);
    public static final Color COLOR_INK = new Color(0x35, 0x1D, 0x1D);
    public static final Color COLOR_CLAY = new Color(0xB5, 0x87, 0x77);
    public static final Color COLOR_BLUSH = new Color(0xE6, 0xCB, 0xBD);
    public static final Color COLOR_SOFT_PAPER = new Color(0xF8, 0xF2, 0xEB);

    public BufferedImage renderCarouselSlide(ContentAsset carouselAsset, int slideIndex, int width, int height) {
        JsonNode payload = carouselAsset.getPayload();
        JsonNode slides = payload.path("slides");
        if (!slides.isArray() || slides.isEmpty()) {
            throw ApiException.unprocessable("Asset payload has no slides");
        }
        if (slideIndex < 0 || slideIndex >= slides.size()) {
            throw ApiException.badRequest("Invalid slide index: " + slideIndex + " (total " + slides.size() + ")");
        }

        JsonNode slide = slides.get(slideIndex);
        int totalSlides = slides.size();
        String title = carouselAsset.getTitle();
        String paperTitle = carouselAsset.getContentPackage().getPaper().getTitle();

        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = image.createGraphics();
        configureQuality(g);

        // Background
        boolean isAccentSlide = (slideIndex == 0 && slide.path("theme").asText("").equals("maroon"))
                || (slideIndex == totalSlides - 1 && slide.path("theme").asText("").equals("maroon"));

        if (isAccentSlide) {
            g.setColor(COLOR_MAROON);
            g.fillRect(0, 0, width, height);
            drawMaroonSlide(g, slide, slideIndex, totalSlides, title, paperTitle, width, height);
        } else {
            g.setColor(COLOR_CREAM);
            g.fillRect(0, 0, width, height);
            drawCreamSlide(g, slide, slideIndex, totalSlides, title, paperTitle, width, height);
        }

        g.dispose();
        return image;
    }

    public byte[] renderCarouselSlidePng(ContentAsset carouselAsset, int slideIndex, int width, int height) {
        BufferedImage img = renderCarouselSlide(carouselAsset, slideIndex, width, height);
        return toPngBytes(img);
    }

    public byte[] renderCarouselZip(ContentAsset carouselAsset, int width, int height) {
        JsonNode slides = carouselAsset.getPayload().path("slides");
        if (!slides.isArray() || slides.isEmpty()) {
            throw ApiException.unprocessable("No slides found");
        }
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(baos)) {
            for (int i = 0; i < slides.size(); i++) {
                byte[] png = renderCarouselSlidePng(carouselAsset, i, width, height);
                String entryName = String.format("slide_%02d.png", i + 1);
                zos.putNextEntry(new ZipEntry(entryName));
                zos.write(png);
                zos.closeEntry();
            }
            zos.finish();
            return baos.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to package carousel zip", e);
        }
    }

    public byte[] renderCarouselPdf(ContentAsset carouselAsset) {
        JsonNode slides = carouselAsset.getPayload().path("slides");
        int count = slides.isArray() ? slides.size() : 0;
        if (count == 0) throw ApiException.unprocessable("No slides to render in PDF");

        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            for (int i = 0; i < count; i++) {
                BufferedImage img = renderCarouselSlide(carouselAsset, i, 1080, 1080);
                PDPage page = new PDPage(new PDRectangle(1080, 1080));
                doc.addPage(page);
                PDImageXObject pdImage = LosslessFactory.createFromImage(doc, img);
                try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                    cs.drawImage(pdImage, 0, 0, 1080, 1080);
                }
            }
            doc.save(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to render carousel PDF", e);
        }
    }

    public BufferedImage renderStaticPost(ContentAsset staticAsset, int width, int height) {
        JsonNode payload = staticAsset.getPayload();
        String headline = payload.path("headline").asText("What the research says");
        String body = payload.path("body").asText("");
        String footer = payload.path("footer").asText("Evidence, without the hype");
        String paperTitle = staticAsset.getContentPackage().getPaper().getTitle();

        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = image.createGraphics();
        configureQuality(g);

        // Cream background
        g.setColor(COLOR_CREAM);
        g.fillRect(0, 0, width, height);

        // Header bar
        g.setColor(COLOR_RUST);
        g.setFont(new Font("Serif", Font.BOLD, (int) (width * 0.038)));
        g.drawString("steer", (int) (width * 0.08), (int) (height * 0.09));

        g.setColor(COLOR_CLAY);
        g.setFont(new Font("SansSerif", Font.BOLD, (int) (width * 0.019)));
        g.drawString("CLINICAL EVIDENCE • DOCTOR-LED METABOLIC CARE", (int) (width * 0.20), (int) (height * 0.086));

        // Format tag pill
        g.setColor(COLOR_BLUSH);
        int pillW = (int) (width * 0.16);
        int pillH = (int) (height * 0.036);
        g.fillRoundRect((int) (width * 0.76), (int) (height * 0.065), pillW, pillH, pillH, pillH);
        g.setColor(COLOR_MAROON);
        g.setFont(new Font("SansSerif", Font.BOLD, (int) (width * 0.016)));
        g.drawString("RESEARCH BRIEF", (int) (width * 0.775), (int) (height * 0.088));

        // Divider
        g.setColor(COLOR_BLUSH);
        g.setStroke(new BasicStroke(2));
        g.drawLine((int) (width * 0.08), (int) (height * 0.12), (int) (width * 0.92), (int) (height * 0.12));

        // Center Editorial Card
        int cardX = (int) (width * 0.08);
        int cardY = (int) (height * 0.16);
        int cardW = (int) (width * 0.84);
        int cardH = (int) (height * 0.70);
        g.setColor(COLOR_SOFT_PAPER);
        g.fillRoundRect(cardX, cardY, cardW, cardH, 32, 32);
        g.setColor(COLOR_BLUSH);
        g.setStroke(new BasicStroke(1.5f));
        g.drawRoundRect(cardX, cardY, cardW, cardH, 32, 32);

        // Headline
        g.setColor(COLOR_RUST);
        g.setFont(new Font("Serif", Font.BOLD, (int) (width * 0.046)));
        drawWrappedText(g, headline, cardX + 50, cardY + 70, cardW - 100, (int) (width * 0.055), 3);

        // Body text
        g.setColor(COLOR_INK);
        g.setFont(new Font("SansSerif", Font.PLAIN, (int) (width * 0.026)));
        drawWrappedText(g, body, cardX + 50, cardY + 220, cardW - 100, (int) (width * 0.038), 6);

        // Indian Context Box
        int ctxBoxY = cardY + cardH - (int) (height * 0.22);
        g.setColor(COLOR_CREAM);
        g.fillRoundRect(cardX + 40, ctxBoxY, cardW - 80, (int) (height * 0.12), 16, 16);
        g.setColor(COLOR_MAROON);
        g.setFont(new Font("SansSerif", Font.BOLD, (int) (width * 0.018)));
        g.drawString("INDIAN CONTEXT & HABITS", cardX + 65, ctxBoxY + 30);
        g.setColor(COLOR_INK);
        g.setFont(new Font("SansSerif", Font.PLAIN, (int) (width * 0.021)));
        g.drawString("Calibrated for Indian bodies, meal patterns, and long-term metabolic health.", cardX + 65, ctxBoxY + 62);
        g.drawString("No quick fixes. Habits and doctor oversight protect muscle and sustain progress.", cardX + 65, ctxBoxY + 90);

        // Verified Pill
        int verPillY = cardY + cardH - (int) (height * 0.075);
        g.setColor(COLOR_MAROON);
        g.fillRoundRect(cardX + 40, verPillY, (int) (width * 0.38), (int) (height * 0.042), 24, 24);
        g.setColor(Color.WHITE);
        g.setFont(new Font("SansSerif", Font.BOLD, (int) (width * 0.016)));
        g.drawString("✓ CLINICALLY VERIFIED CLAIM", cardX + 65, verPillY + (int) (height * 0.027));

        // Bottom footer
        g.setColor(COLOR_CLAY);
        g.setFont(new Font("SansSerif", Font.PLAIN, (int) (width * 0.017)));
        String truncTitle = paperTitle.length() > 65 ? paperTitle.substring(0, 62) + "..." : paperTitle;
        g.drawString("Source: " + truncTitle, (int) (width * 0.08), (int) (height * 0.93));

        g.setColor(COLOR_INK);
        g.setFont(new Font("SansSerif", Font.BOLD, (int) (width * 0.021)));
        g.drawString("steerclub.com", (int) (width * 0.77), (int) (height * 0.93));

        g.dispose();
        return image;
    }

    public byte[] renderStaticPostPng(ContentAsset staticAsset, int width, int height) {
        BufferedImage img = renderStaticPost(staticAsset, width, height);
        return toPngBytes(img);
    }

    public Map<String, Object> generateCanvaDesignSpec(ContentPackage pack) {
        Map<String, Object> spec = new LinkedHashMap<>();
        spec.put("app", "Steer Science Studio Canva Automator");
        spec.put("version", "1.0");
        spec.put("brandColors", Map.of(
                "cream", "#F5EBDF",
                "steerRust", "#C04E2A",
                "deepMaroon", "#661414",
                "ink", "#351D1D",
                "clay", "#B58777",
                "blush", "#E6CBBD",
                "softPaper", "#F8F2EB"
        ));
        spec.put("typography", Map.of(
                "headline", "Playfair Display / Serif Bold",
                "body", "Plus Jakarta Sans / Inter",
                "accent", "Editorial Serif Italic"
        ));
        spec.put("packageId", pack.getId().toString());
        spec.put("paperTitle", pack.getPaper().getTitle());
        spec.put("language", pack.getLanguage());

        List<Map<String, Object>> templates = new ArrayList<>();
        templates.add(Map.of(
                "format", "CAROUSEL",
                "dimensions", "1080x1080 (Square 1:1) and 1080x1350 (Portrait 4:5)",
                "slidesCount", 6,
                "canvaTemplateUrl", "https://www.canva.com/design/templates?query=editorial+carousel",
                "importMethod", "Upload exported SVGs or PNG deck directly into Canva as a multi-page presentation"
        ));
        templates.add(Map.of(
                "format", "STATIC_POST",
                "dimensions", "1080x1080, 1080x1350, 1080x1920",
                "canvaTemplateUrl", "https://www.canva.com/design/templates?query=minimalist+health+quote",
                "importMethod", "Import vector SVG or PNG frame into Canva post layout"
        ));
        templates.add(Map.of(
                "format", "AI_REEL",
                "dimensions", "1080x1920 (9:16 Vertical Video)",
                "canvaTemplateUrl", "https://www.canva.com/design/templates?query=instagram+reels+minimal",
                "importMethod", "Drag rendered scenes and drop synchronized voiceover audio track into Canva Video Editor"
        ));
        spec.put("templates", templates);
        return spec;
    }

    private void drawCreamSlide(Graphics2D g, JsonNode slide, int index, int total, String assetTitle, String paperTitle, int width, int height) {
        int padX = (int) (width * 0.08);
        int padY = (int) (height * 0.08);

        // Steer Wordmark
        g.setColor(COLOR_RUST);
        g.setFont(new Font("Serif", Font.BOLD, (int) (width * 0.038)));
        g.drawString("steer", padX, (int) (height * 0.09));

        g.setColor(COLOR_CLAY);
        g.setFont(new Font("SansSerif", Font.BOLD, (int) (width * 0.018)));
        g.drawString("RESEARCH BRIEF • " + (index == 0 ? "OVERVIEW" : "FINDING " + index), (int) (width * 0.20), (int) (height * 0.086));

        // Slide counter pill
        g.setColor(COLOR_BLUSH);
        int pillW = (int) (width * 0.12);
        int pillH = (int) (height * 0.038);
        g.fillRoundRect(width - padX - pillW, (int) (height * 0.065), pillW, pillH, pillH, pillH);
        g.setColor(COLOR_MAROON);
        g.setFont(new Font("SansSerif", Font.BOLD, (int) (width * 0.017)));
        String counterText = String.format("%02d / %02d", index + 1, total);
        g.drawString(counterText, width - padX - pillW + 20, (int) (height * 0.09));

        // Top line
        g.setColor(COLOR_BLUSH);
        g.setStroke(new BasicStroke(2));
        g.drawLine(padX, (int) (height * 0.12), width - padX, (int) (height * 0.12));

        // Main Soft Card
        int cardX = padX;
        int cardY = (int) (height * 0.16);
        int cardW = width - (2 * padX);
        int cardH = (int) (height * 0.70);
        g.setColor(COLOR_SOFT_PAPER);
        g.fillRoundRect(cardX, cardY, cardW, cardH, 28, 28);
        g.setColor(COLOR_BLUSH);
        g.setStroke(new BasicStroke(1.5f));
        g.drawRoundRect(cardX, cardY, cardW, cardH, 28, 28);

        // Headline
        String headline = slide.path("headline").asText(slide.path("title").asText(""));
        g.setColor(COLOR_RUST);
        g.setFont(new Font("Serif", Font.BOLD, (int) (width * 0.044)));
        int nextY = drawWrappedText(g, headline, cardX + 45, cardY + 70, cardW - 90, (int) (width * 0.052), 3);

        // Body
        String body = slide.path("body").asText(slide.path("text").asText(""));
        g.setColor(COLOR_INK);
        g.setFont(new Font("SansSerif", Font.PLAIN, (int) (width * 0.026)));
        drawWrappedText(g, body, cardX + 45, nextY + 35, cardW - 90, (int) (width * 0.038), 6);

        // Highlight box for findings (middle slides)
        if (index > 0 && index < total - 1) {
            int highlightY = cardY + cardH - (int) (height * 0.22);
            g.setColor(COLOR_CREAM);
            g.fillRoundRect(cardX + 35, highlightY, cardW - 70, (int) (height * 0.11), 16, 16);
            g.setColor(COLOR_MAROON);
            g.setFont(new Font("SansSerif", Font.BOLD, (int) (width * 0.017)));
            g.drawString("WHY IT MATTERS FOR YOU", cardX + 55, highlightY + 28);
            g.setColor(COLOR_INK);
            g.setFont(new Font("SansSerif", Font.PLAIN, (int) (width * 0.020)));
            g.drawString("Metabolic changes are biological, not personal willpower failures.", cardX + 55, highlightY + 58);
            g.drawString("Steer doctors build sustainable nutrition and muscle-preserving routines.", cardX + 55, highlightY + 84);

            int claimPillY = cardY + cardH - (int) (height * 0.075);
            g.setColor(COLOR_MAROON);
            g.fillRoundRect(cardX + 35, claimPillY, (int) (width * 0.36), (int) (height * 0.040), 20, 20);
            g.setColor(Color.WHITE);
            g.setFont(new Font("SansSerif", Font.BOLD, (int) (width * 0.015)));
            g.drawString("✓ CLINICALLY VERIFIED CLAIM", cardX + 55, claimPillY + (int) (height * 0.026));
        } else if (index == 0) {
            // Intro slide callout
            int highlightY = cardY + cardH - (int) (height * 0.16);
            g.setColor(COLOR_CREAM);
            g.fillRoundRect(cardX + 35, highlightY, cardW - 70, (int) (height * 0.10), 16, 16);
            g.setColor(COLOR_RUST);
            g.setFont(new Font("SansSerif", Font.BOLD, (int) (width * 0.018)));
            g.drawString("DOCTOR-LED • EVIDENCE-FIRST • BUILT FOR INDIA", cardX + 55, highlightY + 34);
            g.setColor(COLOR_INK);
            g.setFont(new Font("SansSerif", Font.PLAIN, (int) (width * 0.020)));
            g.drawString("Swipe through to understand the science behind metabolic health.", cardX + 55, highlightY + 68);
        } else {
            // Final slide callout
            int highlightY = cardY + cardH - (int) (height * 0.18);
            g.setColor(COLOR_RUST);
            g.fillRoundRect(cardX + 35, highlightY, cardW - 70, (int) (height * 0.12), 16, 16);
            g.setColor(Color.WHITE);
            g.setFont(new Font("Serif", Font.BOLD, (int) (width * 0.026)));
            g.drawString("Start your metabolic assessment", cardX + 55, highlightY + 42);
            g.setFont(new Font("SansSerif", Font.PLAIN, (int) (width * 0.020)));
            g.drawString("Explore doctor-led metabolic care calibrated for Indian biology.", cardX + 55, highlightY + 76);
        }

        // Bottom Footer
        g.setColor(COLOR_CLAY);
        g.setFont(new Font("SansSerif", Font.PLAIN, (int) (width * 0.017)));
        String trunc = paperTitle.length() > 65 ? paperTitle.substring(0, 62) + "..." : paperTitle;
        g.drawString("Source: " + trunc, padX, (int) (height * 0.93));

        g.setColor(COLOR_INK);
        g.setFont(new Font("SansSerif", Font.BOLD, (int) (width * 0.021)));
        g.drawString("steerclub.com", (int) (width * 0.77), (int) (height * 0.93));
    }

    private void drawMaroonSlide(Graphics2D g, JsonNode slide, int index, int total, String assetTitle, String paperTitle, int width, int height) {
        int padX = (int) (width * 0.08);

        g.setColor(COLOR_CREAM);
        g.setFont(new Font("Serif", Font.BOLD, (int) (width * 0.038)));
        g.drawString("steer", padX, (int) (height * 0.09));

        g.setColor(COLOR_BLUSH);
        g.setFont(new Font("SansSerif", Font.BOLD, (int) (width * 0.018)));
        g.drawString("CLINICAL TAKEAWAY", (int) (width * 0.20), (int) (height * 0.086));

        // Headline
        String headline = slide.path("headline").asText("");
        g.setColor(COLOR_CREAM);
        g.setFont(new Font("Serif", Font.BOLD, (int) (width * 0.052)));
        int nextY = drawWrappedText(g, headline, padX, (int) (height * 0.25), width - (2 * padX), (int) (width * 0.062), 4);

        // Body
        String body = slide.path("body").asText("");
        g.setColor(COLOR_BLUSH);
        g.setFont(new Font("SansSerif", Font.PLAIN, (int) (width * 0.028)));
        drawWrappedText(g, body, padX, nextY + 40, width - (2 * padX), (int) (width * 0.040), 6);

        // Bottom signoff
        g.setColor(COLOR_CREAM);
        g.setFont(new Font("SansSerif", Font.BOLD, (int) (width * 0.024)));
        g.drawString("steerclub.com", padX, (int) (height * 0.90));
        g.setColor(COLOR_BLUSH);
        g.setFont(new Font("SansSerif", Font.PLAIN, (int) (width * 0.018)));
        g.drawString("Doctor-led. Calibrated for Indian biology.", padX, (int) (height * 0.94));
    }

    private int drawWrappedText(Graphics2D g, String text, int x, int y, int maxWidth, int lineHeight, int maxLines) {
        if (text == null || text.isBlank()) return y;
        FontMetrics fm = g.getFontMetrics();
        String[] words = text.split("\\s+");
        StringBuilder currentLine = new StringBuilder();
        int currentY = y;
        int linesDrawn = 0;

        for (String word : words) {
            String testLine = currentLine.isEmpty() ? word : currentLine + " " + word;
            if (fm.stringWidth(testLine) > maxWidth) {
                if (!currentLine.isEmpty()) {
                    g.drawString(currentLine.toString(), x, currentY);
                    currentY += lineHeight;
                    linesDrawn++;
                    if (linesDrawn >= maxLines - 1) {
                        currentLine = new StringBuilder(word + "...");
                        break;
                    }
                }
                currentLine = new StringBuilder(word);
            } else {
                currentLine = new StringBuilder(testLine);
            }
        }
        if (!currentLine.isEmpty() && linesDrawn < maxLines) {
            g.drawString(currentLine.toString(), x, currentY);
            currentY += lineHeight;
        }
        return currentY;
    }

    private void configureQuality(Graphics2D g) {
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON);
    }

    private byte[] toPngBytes(BufferedImage img) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(img, "PNG", baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to encode PNG", e);
        }
    }
}

