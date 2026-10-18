package org.springboot.backend.ai;

import tools.jackson.databind.JsonNode;
import java.util.List;
import org.springboot.backend.domain.DomainTypes.AssetType;

public interface AiGateway {
    GeneratedContent generate(PaperInput paper,String language,String audience);
    String providerName();
    record PaperInput(String title,List<String> pages){}
    record GeneratedClaim(String claim,String plainLanguage,String evidenceQuote,int pageNumber,String section,double confidence){}
    record GeneratedAsset(AssetType type,String title,JsonNode payload,List<Integer> claimIndexes){}
    record GeneratedContent(String coreMessage,String reasoning,List<GeneratedClaim> claims,List<GeneratedAsset> assets){}
}
