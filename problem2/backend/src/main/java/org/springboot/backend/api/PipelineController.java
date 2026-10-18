package org.springboot.backend.api;

import jakarta.validation.Valid;
import org.springboot.backend.domain.*;
import org.springboot.backend.ingest.PaperIngestionService;
import org.springboot.backend.pipeline.*;
import org.springboot.backend.repository.PaperRepository;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.net.URI;
import java.util.*;
import static org.springboot.backend.api.ApiDtos.*;

@RestController @RequestMapping("/api/v1")
public class PipelineController {
    private final PaperIngestionService ingestion;private final PaperRepository papers;private final PipelineService pipeline;private final BatchService batches;
    public PipelineController(PaperIngestionService ingestion,PaperRepository papers,PipelineService pipeline,BatchService batches){this.ingestion=ingestion;this.papers=papers;this.pipeline=pipeline;this.batches=batches;}
    @PostMapping(value="/papers/upload",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<PaperView> upload(@RequestPart("file") MultipartFile file,@RequestPart(value="title",required=false) String title){Paper p=ingestion.ingestPdf(file,title);return ResponseEntity.created(URI.create("/api/v1/papers/"+p.getId())).body(ApiDtos.paper(p));}
    @PostMapping("/papers/from-url") ResponseEntity<PaperView> fromUrl(@Valid @RequestBody UrlIngestRequest request){Paper p=ingestion.ingestUrl(request.url(),request.title());return ResponseEntity.created(URI.create("/api/v1/papers/"+p.getId())).body(ApiDtos.paper(p));}
    @GetMapping("/papers") public List<PaperView> listPapers(){return papers.findAllByOrderByCreatedAtDesc().stream().map(ApiDtos::paper).toList();}
    @GetMapping("/papers/{id}") PaperView paper(@PathVariable UUID id){return ApiDtos.paper(papers.findById(id).orElseThrow(()->org.springboot.backend.common.ApiException.notFound("Paper not found")));}
    @GetMapping("/papers/{id}/packages") public List<PackageView> paperPackages(@PathVariable UUID id){return pipeline.findByPaper(id).stream().map(this::view).toList();}
    @GetMapping("/papers/{id}/source") ResponseEntity<byte[]> source(@PathVariable UUID id){Paper p=papers.findById(id).orElseThrow(()->org.springboot.backend.common.ApiException.notFound("Paper not found"));String extension=p.getContentType().startsWith("application/pdf")?".pdf":".html";String filename=p.getFileName()==null||p.getFileName().isBlank()?"research-source"+extension:p.getFileName();return ResponseEntity.ok().contentType(MediaType.parseMediaType(p.getContentType())).header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.inline().filename(filename).build().toString()).header(HttpHeaders.CACHE_CONTROL,"private, no-store").body(p.getSourceContent());}
    @PostMapping("/papers/{id}/generate") ResponseEntity<PackageView> generate(@PathVariable UUID id,@Valid @RequestBody(required=false) GenerateRequest request){String language=request==null||request.language()==null?"en":request.language();String audience=request==null||request.audience()==null||request.audience().isBlank()?"Adults in India who are curious but sceptical about metabolic health":request.audience();ContentPackage pack=pipeline.generate(id,language,audience);return ResponseEntity.created(URI.create("/api/v1/packages/"+pack.getId())).body(view(pack));}
    @GetMapping("/packages") public List<PackageView> listPackages(@RequestParam(name="paperId",required=false) UUID paperId){List<ContentPackage> list=paperId!=null?pipeline.findByPaper(paperId):pipeline.listAllPackages();return list.stream().map(this::view).toList();}
    @GetMapping("/packages/{id}") PackageView packageView(@PathVariable UUID id){return view(pipeline.get(id));}
    @PostMapping("/batches") ResponseEntity<BatchView> batch(@Valid @RequestBody BatchRequest request){String language=request.language()==null?"en":request.language();String audience=request.audience()==null||request.audience().isBlank()?"Adults in India interested in metabolic health":request.audience();return ResponseEntity.accepted().body(ApiDtos.batch(batches.start(List.copyOf(request.paperIds()),language,audience)));}
    @GetMapping("/batches/{id}") BatchView batch(@PathVariable UUID id){return ApiDtos.batch(batches.get(id));}
    private PackageView view(ContentPackage p){List<ClaimView> claimViews=pipeline.claims(p.getId()).stream().map(ApiDtos::claim).toList();List<AssetView> assetViews=pipeline.assets(p.getId()).stream().map(ApiDtos::asset).toList();boolean ready=!claimViews.isEmpty()&&claimViews.stream().allMatch(c->c.evidenceVerified()&&c.reviewStatus()==org.springboot.backend.domain.DomainTypes.ClaimReviewStatus.APPROVED);return new PackageView(p.getId(),ApiDtos.paper(p.getPaper()),p.getLanguage(),p.getAudience(),p.getCoreMessage(),p.getReasoning(),p.getStatus(),p.getAiProvider(),p.getPromptVersion(),p.getEstimatedHumanMinutes(),ready,claimViews,assetViews,p.getCreatedAt());}
}
