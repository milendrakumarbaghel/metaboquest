package org.springboot.backend.ai;

import tools.jackson.databind.*;
import tools.jackson.databind.node.*;
import org.springboot.backend.domain.DomainTypes.AssetType;
import java.util.*;
import java.util.regex.*;

public class ExtractiveAiGateway implements AiGateway {
    private final ObjectMapper mapper;
    public ExtractiveAiGateway(ObjectMapper mapper){this.mapper=mapper;}
    @Override public String providerName(){return "extractive-local";}
    @Override public GeneratedContent generate(PaperInput paper,String language,String audience){
        String lang = language == null ? "en" : language.toLowerCase(Locale.ROOT);
        List<GeneratedClaim> claims = new ArrayList<>();
        Pattern interesting = Pattern.compile("(?i).*(\\d|%|risk|weight|muscle|insulin|glucose|metabolic|obesity|trial|significant|loss|regain).*", Pattern.DOTALL);

        for (int page = 0; page < paper.pages().size() && claims.size() < 4; page++) {
            for (String raw : paper.pages().get(page).split("(?<=[.!?])\\s+")) {
                String sentence = raw.replaceAll("\\s+", " ").trim();
                if (sentence.length() >= 45 && sentence.length() <= 360 && interesting.matcher(sentence).matches() && !sentence.matches(".*(?i)(copyright|references|doi\\.org|all rights reserved).*")) {
                    String plainLanguage = translateSentence(sentence, lang, claims.size() + 1);
                    claims.add(new GeneratedClaim(sentence, plainLanguage, sentence, page + 1, "Results & Discussion", 0.85));
                    if (claims.size() == 4) break;
                }
            }
        }
        if (claims.isEmpty()) {
            String sentence = paper.pages().stream().flatMap(p -> Arrays.stream(p.split("(?<=[.!?])\\s+"))).map(s -> s.replaceAll("\\s+", " ").trim()).filter(s -> s.length() >= 45 && s.length() <= 360).findFirst().orElseThrow(() -> new IllegalArgumentException("No usable finding could be extracted"));
            int page = IntStreamRange.pageOf(paper.pages(), sentence);
            String plainLanguage = translateSentence(sentence, lang, 1);
            claims.add(new GeneratedClaim(sentence, plainLanguage, sentence, page, "Results", 0.75));
        }

        String core = claims.getFirst().plainLanguage();
        String reasoning = "hi".equals(lang)
                ? "यह निष्कर्ष वैज्ञानिक शोध पर आधारित है और भारतीय वयस्कों के लिए सरल हिंदी में तैयार किया गया है। डॉक्टर की समीक्षा आवश्यक है।"
                : "hinglish".equals(lang)
                ? "Yeh message strongest extractable finding ko highlight karta hai, relatable Indian context ke saath. Doctor approval ke baad hi publish hoga."
                : "This message foregrounds the strongest directly extractable finding. A doctor must approve every claim before publishing.";

        List<GeneratedAsset> assets = List.of(
                new GeneratedAsset(AssetType.CAROUSEL, carouselTitle(lang), carousel(paper.title(), claims, lang), indexes(claims)),
                new GeneratedAsset(AssetType.STATIC, staticTitle(lang), staticPost(core, lang), List.of(0)),
                new GeneratedAsset(AssetType.REEL, reelTitle(lang), reel(core, lang), List.of(0)),
                new GeneratedAsset(AssetType.CAPTION, "Instagram caption", caption(core, lang), List.of(0))
        );
        return new GeneratedContent(core, reasoning, claims, assets);
    }

    private String translateSentence(String raw, String lang, int index) {
        if ("hi".equals(lang)) {
            return "शोध निष्कर्ष " + index + ": यह अध्ययन प्रमाणित करता है कि मेटाबॉलिक स्वास्थ्य और वज़न नियंत्रण जैविक प्रक्रियाओं से संचालित होते हैं। (" + raw + ")";
        } else if ("hinglish".equals(lang)) {
            return "Study finding " + index + ": Research show karti hai ki metabolic health aur weight control body ki natural biology par depend karta hai. (" + raw + ")";
        }
        return raw;
    }

    private String carouselTitle(String lang) {
        if ("hi".equals(lang)) return "शोध पत्र के मुख्य निष्कर्ष (कैरोसेल)";
        if ("hinglish".equals(lang)) return "Iss research paper ke main findings (Carousel)";
        return "What this paper found";
    }

    private String staticTitle(String lang) {
        if ("hi".equals(lang)) return "एक महत्वपूर्ण वैज्ञानिक निष्कर्ष";
        if ("hinglish".equals(lang)) return "Ek zaroori finding jo aapko pata honi chahiye";
        return "One finding worth knowing";
    }

    private String reelTitle(String lang) {
        if ("hi".equals(lang)) return "शोध सारांश 30 सेकंड में (रील)";
        if ("hinglish".equals(lang)) return "Research paper, 30 seconds mein (Reel)";
        return "The paper, in 30 seconds";
    }

    private JsonNode carousel(String title, List<GeneratedClaim> claims, String lang) {
        ObjectNode p = mapper.createObjectNode();
        ArrayNode slides = p.putArray("slides");

        // Slide 1: Cover
        String coverHeadline = "hi".equals(lang) ? "शोध पत्र: आसान भाषा में" : "hinglish".equals(lang) ? "Research paper, bilkul simple bhasha mein" : "A research paper, made simpler";
        slides.addObject().put("headline", coverHeadline).put("body", title).put("theme", "maroon");

        // Slides 2..N: Findings
        for (int i = 0; i < claims.size(); i++) {
            String fHeadline = "hi".equals(lang) ? "प्रमुख निष्कर्ष " + (i + 1) : "hinglish".equals(lang) ? "Finding " + (i + 1) : "Finding " + (i + 1);
            slides.addObject().put("headline", fHeadline).put("body", claims.get(i).plainLanguage()).putArray("claimIndexes").add(i);
        }

        // Final Slide: Doctor advice
        String doctorHeadline = "hi".equals(lang) ? "अपने डॉक्टर से परामर्श लें" : "hinglish".equals(lang) ? "Apne doctor se baat karein" : "Take it to your doctor";
        String doctorBody = "hi".equals(lang)
                ? "वैज्ञानिक शोध बातचीत की शुरुआत है; यह व्यक्तिगत चिकित्सीय सलाह की जगह नहीं ले सकता। स्टीयर में विशेषज्ञ डॉक्टरों से मिलें।"
                : "hinglish".equals(lang)
                ? "Research ek better conversation shuru karne ke liye hai; yeh individual medical advice ko replace nahi karti. Steer doctor se check karein."
                : "Research informs a conversation; it does not replace individual medical advice. Consult a Steer doctor at steerclub.com.";
        slides.addObject().put("headline", doctorHeadline).put("body", doctorBody);

        p.put("dimensions", "1080x1350");
        return p;
    }

    private JsonNode staticPost(String core, String lang) {
        String headline = "hi".equals(lang) ? "वैज्ञानिक प्रमाण क्या कहते हैं" : "hinglish".equals(lang) ? "Research kya kehti hai" : "What the research says";
        String footer = "hi".equals(lang) ? "वैज्ञानिक प्रमाण, बिना किसी दिखावे के" : "hinglish".equals(lang) ? "Evidence, bina kisi hype ke" : "Evidence, without the hype";
        return mapper.createObjectNode().put("headline", headline).put("body", core).put("footer", footer).put("dimensions", "1080x1350");
    }

    private JsonNode reel(String core, String lang) {
        ObjectNode p = mapper.createObjectNode();
        String hook = "hi".equals(lang) ? "एक शोध पत्र। एक महत्वपूर्ण सीख।" : "hinglish".equals(lang) ? "Ek paper. Ek useful takeaway jo aapko pata hona chahiye." : "One paper. One useful takeaway.";
        p.put("hook", hook).put("totalSeconds", 30).put("musicMood", "warm, minimal, credible");

        ArrayNode scenes = p.putArray("scenes");
        // Scene 1
        String s1Vo = "hi".equals(lang) ? "यहाँ एक नए चिकित्सा शोध का मुख्य निष्कर्ष प्रस्तुत है।" : "hinglish".equals(lang) ? "Yeh hai ek naye paper ka sabse zaroori finding." : "Here is one useful finding from a new paper.";
        String s1Sub = "hi".equals(lang) ? "शोध, सरल शब्दों में" : "hinglish".equals(lang) ? "Research, simplified" : "Research, made simpler";
        scenes.addObject().put("time", "0-3s").put("visual", "Paper title appears as a clean, warm editorial headline").put("voiceover", s1Vo).put("subtitle", s1Sub);

        // Scene 2
        scenes.addObject().put("time", "3-15s").put("visual", "Warm motion typography displaying the key clinical evidence").put("voiceover", core).put("subtitle", core);

        // Scene 3
        String s3Vo = "hi".equals(lang) ? "मेटाबॉलिक स्वास्थ्य केवल इच्छाशक्ति नहीं, बल्कि शरीर का जैविक तंत्र है।" : "hinglish".equals(lang) ? "Metabolic health sirf willpower nahi, body ki internal biology hai." : "Metabolic health is biology, not willpower.";
        String s3Sub = "hi".equals(lang) ? "जैविक तंत्र, न कि केवल इच्छाशक्ति" : "hinglish".equals(lang) ? "Biology, not willpower" : "Biology, not willpower";
        scenes.addObject().put("time", "15-23s").put("visual", "Indian adult at desk taking chai break; family dinner table with rotis and dal").put("voiceover", s3Vo).put("subtitle", s3Sub);

        // Scene 4
        String s4Vo = "hi".equals(lang) ? "अपने डॉक्टर से बेहतर बातचीत शुरू करने के लिए शोध का उपयोग करें।" : "hinglish".equals(lang) ? "Apne doctor se sahi sawal poochne ke liye iss evidence ko use karein." : "Use research to start a better conversation with your doctor.";
        String s4Sub = "hi".equals(lang) ? "व्यक्तिगत चिकित्सीय सलाह नहीं • steerclub.com" : "hinglish".equals(lang) ? "Not medical advice • steerclub.com" : "Not individual medical advice • steerclub.com";
        scenes.addObject().put("time", "23-30s").put("visual", "Source card and Steer doctor review verification badge").put("voiceover", s4Vo).put("subtitle", s4Sub);

        p.putArray("bRollPrompts")
                .add("Indian professional at office desk having afternoon chai, calm realistic documentary style, no body transformation")
                .add("Warm Indian home dining table with rotis, dal, and fresh vegetables, relaxed family atmosphere")
                .add("Morning walk in an Indian city park, active routine, positive health habits");
        return p;
    }

    private JsonNode caption(String core, String lang) {
        ObjectNode payload = mapper.createObjectNode();
        String text;
        if ("hi".equals(lang)) {
            text = core + "\n\nवैज्ञानिक शोध सही प्रश्न पूछने में मदद करता है। यह व्यक्तिगत निर्णय नहीं ले सकता—योग्य डॉक्टर से परामर्श करें।\n\nसमीक्षा कार्ड में स्रोत लिंक उपलब्ध है।\n\nsteerclub.com";
        } else if ("hinglish".equals(lang)) {
            text = core + "\n\nResearch aapko doctor se sahi questions poochne mein help karti hai. Har body alag hoti hai—apne doctor se consult karein.\n\nSource review card mein linked hai.\n\nsteerclub.com";
        } else {
            text = core + "\n\nResearch can guide better questions. It cannot decide what is right for you—talk to a qualified doctor.\n\nSource linked in the review card.\n\nsteerclub.com";
        }
        payload.put("text", text);
        payload.putArray("hashtags").add("#MetabolicHealth").add("#HealthResearch").add("#SteerClub").add("#GLP1Facts").add("#EvidenceFirst");
        return payload;
    }

    private List<Integer> indexes(List<?> claims){List<Integer> values=new ArrayList<>();for(int i=0;i<claims.size();i++)values.add(i);return values;}
    private static final class IntStreamRange {static int pageOf(List<String> pages,String sentence){for(int i=0;i<pages.size();i++)if(pages.get(i).contains(sentence))return i+1;return 1;}}
}
