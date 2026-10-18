package org.springboot.backend.ai;

import tools.jackson.databind.*;
import tools.jackson.databind.node.*;
import org.springboot.backend.common.ApiException;
import org.springboot.backend.domain.DomainTypes.AssetType;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

public class CompatibleAiGateway implements AiGateway {
    private final HttpClient http; private final ObjectMapper mapper; private final String baseUrl,key,model;
    public CompatibleAiGateway(HttpClient http,ObjectMapper mapper,String baseUrl,String key,String model){this.http=http;this.mapper=mapper;this.baseUrl=baseUrl;this.key=key;this.model=model;}
    @Override public String providerName(){return "compatible:"+model;}
    @Override public GeneratedContent generate(PaperInput paper,String language,String audience){
        try{
            ObjectNode body=mapper.createObjectNode().put("model",model).put("temperature",0.2);
            ArrayNode messages=body.putArray("messages");
            messages.addObject().put("role","developer").put("content",PromptTemplate.system());
            messages.addObject().put("role","user").put("content",PromptTemplate.user(paper,language,audience));
            body.set("response_format",schema());
            HttpRequest request=HttpRequest.newBuilder(URI.create(baseUrl+"/chat/completions")).timeout(Duration.ofSeconds(90))
                    .header("Authorization","Bearer "+key).header("Content-Type","application/json").header("X-Client-Request-Id",UUID.randomUUID().toString())
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body),StandardCharsets.UTF_8)).build();
            HttpResponse<String> response=http.send(request,HttpResponse.BodyHandlers.ofString());
            if(response.statusCode()/100!=2) throw new IllegalStateException("AI endpoint returned "+response.statusCode());
            JsonNode root=mapper.readTree(response.body());
            String content=root.path("choices").path(0).path("message").path("content").asText();
            if(content.isBlank()) throw new IllegalStateException("AI endpoint returned no structured content");
            return parse(mapper.readTree(content));
        }catch(InterruptedException e){Thread.currentThread().interrupt();throw new ApiException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,"AI generation was interrupted");}
        catch(ApiException e){throw e;}catch(Exception e){throw new ApiException(org.springframework.http.HttpStatus.BAD_GATEWAY,"AI generation failed: "+e.getMessage());}
    }
    private ObjectNode schema(){
        ObjectNode response=mapper.createObjectNode().put("type","json_schema");
        ObjectNode format=response.putObject("json_schema").put("name","steer_content_package").put("strict",false);
        try{format.set("schema",mapper.readTree(SCHEMA));}catch(Exception e){throw new IllegalStateException(e);} return response;
    }
    private GeneratedContent parse(JsonNode n){
        List<GeneratedClaim> claims=new ArrayList<>();
        n.path("claims").forEach(c->claims.add(new GeneratedClaim(c.path("claim").asText(),c.path("plainLanguage").asText(),c.path("evidenceQuote").asText(),c.path("pageNumber").asInt(),c.path("section").asText(""),c.path("confidence").asDouble())));
        List<GeneratedAsset> assets=new ArrayList<>();
        n.path("assets").forEach(a->{List<Integer> indexes=new ArrayList<>();a.path("claimIndexes").forEach(i->indexes.add(i.asInt()));assets.add(new GeneratedAsset(AssetType.valueOf(a.path("type").asText()),a.path("title").asText(),a.path("payload"),indexes));});
        return new GeneratedContent(n.path("coreMessage").asText(),n.path("reasoning").asText(),claims,assets);
    }
    private static final String SCHEMA="""
{"type":"object","additionalProperties":false,"required":["coreMessage","reasoning","claims","assets"],"properties":{"coreMessage":{"type":"string"},"reasoning":{"type":"string"},"claims":{"type":"array","minItems":1,"maxItems":5,"items":{"type":"object","additionalProperties":false,"required":["claim","plainLanguage","evidenceQuote","pageNumber","section","confidence"],"properties":{"claim":{"type":"string"},"plainLanguage":{"type":"string"},"evidenceQuote":{"type":"string"},"pageNumber":{"type":"integer","minimum":1},"section":{"type":"string"},"confidence":{"type":"number","minimum":0,"maximum":1}}}},"assets":{"type":"array","minItems":4,"items":{"type":"object","additionalProperties":false,"required":["type","title","payload","claimIndexes"],"properties":{"type":{"type":"string","enum":["CAROUSEL","STATIC","REEL","CAPTION"]},"title":{"type":"string"},"payload":{"type":"object"},"claimIndexes":{"type":"array","items":{"type":"integer","minimum":0}}}}}}}
""";
}
