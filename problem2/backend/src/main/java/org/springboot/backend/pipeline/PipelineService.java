package org.springboot.backend.pipeline;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import org.springboot.backend.ai.*;
import org.springboot.backend.common.ApiException;
import org.springboot.backend.domain.*;
import org.springboot.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import java.time.*;
import java.util.*;
import static org.springboot.backend.domain.DomainTypes.*;

@Service
public class PipelineService {
    private final PaperRepository papers; private final ContentPackageRepository packages; private final ClaimRepository claims; private final ContentAssetRepository assets; private final AiGateway ai; private final ObjectMapper mapper; private final Clock clock;
    public PipelineService(PaperRepository papers,ContentPackageRepository packages,ClaimRepository claims,ContentAssetRepository assets,AiGateway ai,ObjectMapper mapper,Clock clock){this.papers=papers;this.packages=packages;this.claims=claims;this.assets=assets;this.ai=ai;this.mapper=mapper;this.clock=clock;}

    @Transactional(propagation=Propagation.REQUIRES_NEW)
    public ContentPackage generate(UUID paperId,String language,String audience){
        Paper paper=papers.findById(paperId).orElseThrow(()->ApiException.notFound("Paper not found"));
        List<String> pages=List.of(paper.getRawText().split("\\f",-1));
        AiGateway.GeneratedContent generated;
        try{generated=ai.generate(new AiGateway.PaperInput(paper.getTitle(),pages),language,audience);}catch(RuntimeException e){paper.failed(safe(e.getMessage()),clock.instant());throw e;}
        validateShape(generated);
        Instant now=clock.instant();
        ContentPackage pack=packages.save(new ContentPackage(UUID.randomUUID(),paper,language,audience,limited(generated.coreMessage(),1000),generated.reasoning(),ai.providerName(),PromptTemplate.VERSION,12,now));
        List<Claim> stored=new ArrayList<>();
        for(var item:generated.claims()){
            if(item.pageNumber()<1||item.pageNumber()>pages.size())throw ApiException.unprocessable("AI returned an invalid evidence page");
            boolean verified=containsNormalized(pages.get(item.pageNumber()-1),item.evidenceQuote());
            if(!verified)throw ApiException.unprocessable("AI evidence quote was not found on page "+item.pageNumber());
            stored.add(claims.save(new Claim(UUID.randomUUID(),pack,item.claim(),item.plainLanguage(),item.evidenceQuote(),item.pageNumber(),limited(item.section(),300),Math.max(0,Math.min(1,item.confidence())),true,now)));
        }
        Set<AssetType> types=EnumSet.noneOf(AssetType.class);
        for(var item:generated.assets()){
            types.add(item.type());ArrayNode ids=mapper.createArrayNode();
            for(Integer index:item.claimIndexes()){if(index<0||index>=stored.size())throw ApiException.unprocessable("An asset references an unknown claim");ids.add(stored.get(index).getId().toString());}
            assets.save(new ContentAsset(UUID.randomUUID(),pack,item.type(),limited(item.title(),300),item.payload(),ids,now));
        }
        if(!types.containsAll(EnumSet.allOf(AssetType.class)))throw ApiException.unprocessable("AI must create carousel, static, reel and caption assets");
        paper.generated(now);return pack;
    }
    @Transactional(readOnly=true) public ContentPackage get(UUID id){return packages.findDetailed(id).orElseThrow(()->ApiException.notFound("Content package not found"));}
    @Transactional(readOnly=true) public List<Claim> claims(UUID id){get(id);return claims.findByContentPackageIdOrderByPageNumberAsc(id);}
    @Transactional(readOnly=true) public List<ContentAsset> assets(UUID id){get(id);return assets.findByContentPackageIdOrderByAssetTypeAsc(id);}
    private void validateShape(AiGateway.GeneratedContent g){if(g==null||g.claims()==null||g.claims().isEmpty()||g.claims().size()>5||g.assets()==null)throw ApiException.unprocessable("AI output did not match the required content structure");}
    private boolean containsNormalized(String page,String quote){if(quote==null||quote.trim().length()<20)return false;return normalize(page).contains(normalize(quote));}
    private String normalize(String value){return value.replaceAll("[\\s\\u00A0]+"," ").replaceAll("[“”]","\\\"").replaceAll("[‘’]","'").trim().toLowerCase(Locale.ROOT);}
    private String limited(String value,int max){if(value==null)return "";return value.substring(0,Math.min(max,value.length()));}
    private String safe(String value){return limited(value==null?"Generation failed":value,1000);}
}
