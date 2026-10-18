package org.springboot.backend.ingest;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.jsoup.Jsoup;
import org.springboot.backend.common.ApiException;
import org.springboot.backend.domain.Paper;
import org.springboot.backend.domain.DomainTypes.PaperSourceType;
import org.springboot.backend.repository.PaperRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;

@Service
public class PaperIngestionService {
    public static final int MAX_BYTES=20*1024*1024;
    private final PaperRepository papers; private final HttpClient http; private final Clock clock;
    public PaperIngestionService(PaperRepository papers,HttpClient http,Clock clock){this.papers=papers;this.http=http;this.clock=clock;}

    @Transactional
    public Paper ingestPdf(MultipartFile file,String suppliedTitle){
        if(file==null||file.isEmpty()) throw ApiException.badRequest("A non-empty PDF is required");
        if(file.getSize()>MAX_BYTES) throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE,"PDF must be 20 MB or smaller");
        try{
            byte[] bytes=file.getBytes();
            if(bytes.length<5||bytes[0]!='%'||bytes[1]!='P'||bytes[2]!='D'||bytes[3]!='F'||bytes[4]!='-') throw ApiException.badRequest("The uploaded file is not a PDF");
            Extracted extracted=extractPdf(bytes);
            String title=cleanTitle(suppliedTitle,file.getOriginalFilename(),extracted.title());
            return store(title,PaperSourceType.PDF,null,safeFilename(file.getOriginalFilename()),"application/pdf",bytes,extracted.pages());
        }catch(ApiException e){throw e;}catch(Exception e){throw ApiException.unprocessable("PDF could not be read: "+e.getMessage());}
    }

    @Transactional
    public Paper ingestUrl(String value,String suppliedTitle){
        try{
            URI rawUri=URI.create(value.trim());
            URI uri=validatePublicHttps(rawUri);
            String host=uri.getHost().toLowerCase(Locale.ROOT);
            String path=uri.getPath();
            URI fetchUri=uri;
            boolean isPubMed=false;

            if(host.contains("pubmed.ncbi.nlm.nih.gov")){
                var matcher=java.util.regex.Pattern.compile("/(\\d+)").matcher(path);
                if(matcher.find()){
                    String pmid=matcher.group(1);
                    fetchUri=URI.create("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id="+pmid+"&retmode=text&rettype=abstract");
                    isPubMed=true;
                }
            }else if(host.contains("ncbi.nlm.nih.gov")&&path.matches(".*PMC\\d+.*")){
                var matcher=java.util.regex.Pattern.compile("PMC(\\d+)").matcher(path);
                if(matcher.find()){
                    String pmcid=matcher.group(1);
                    fetchUri=URI.create("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id="+pmcid+"&retmode=text");
                }
            }

            HttpResponse<byte[]> response=null;
            for(int redirect=0;redirect<4;redirect++){
                response=http.send(HttpRequest.newBuilder(fetchUri)
                        .timeout(Duration.ofSeconds(25))
                        .header("User-Agent","Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
                        .header("Accept","text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8")
                        .header("Accept-Language","en-US,en;q=0.9")
                        .GET().build(),HttpResponse.BodyHandlers.ofByteArray());
                if(response.body().length>MAX_BYTES) throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE,"Remote paper must be 20 MB or smaller");
                if(response.statusCode()/100==3){String location=response.headers().firstValue("location").orElseThrow(()->ApiException.badRequest("Redirect has no destination"));fetchUri=validatePublicHttps(fetchUri.resolve(location));continue;}
                break;
            }
            if(response==null||response.statusCode()/100!=2){
                if(response!=null&&response.statusCode()==403){
                    throw ApiException.badRequest("Publisher ("+uri.getHost()+") blocked automated fetch (HTTP 403 bot challenge). Please upload the PDF directly.");
                }
                throw ApiException.badRequest("Paper URL returned HTTP "+(response!=null?response.statusCode():"error"));
            }
            String type=response.headers().firstValue("content-type").orElse("").toLowerCase(Locale.ROOT);
            List<String> pages; String discovered=null;
            if(isPubMed){
                String fullText=new String(response.body(),StandardCharsets.UTF_8).trim();
                if(fullText.length()<200) throw ApiException.unprocessable("Could not retrieve readable abstract from PubMed");
                String[] paragraphs=fullText.split("\\n\\s*\\n");
                if(paragraphs.length>=2) discovered=paragraphs[1].replaceAll("\\s+"," ").trim();
                pages=List.of(fullText);
            }else if(type.contains("pdf")||startsPdf(response.body())){
                Extracted extracted=extractPdf(response.body());pages=extracted.pages();discovered=extracted.title();
            }else{
                var document=Jsoup.parse(new String(response.body(),StandardCharsets.UTF_8),fetchUri.toString());
                document.select("script,style,nav,footer,header,form").remove();
                String text=document.body().text().replaceAll("\\s+"," ").trim();
                if(text.length()<400)throw ApiException.unprocessable("The linked page contains too little readable research text");
                pages=List.of(text);discovered=document.title();
            }
            String storedType=(type.contains("pdf")||startsPdf(response.body()))?"application/pdf":"text/html;charset=UTF-8";
            return store(cleanTitle(suppliedTitle,null,discovered),PaperSourceType.URL,uri.toString(),null,storedType,response.body(),pages);
        }catch(ApiException e){throw e;}catch(InterruptedException e){Thread.currentThread().interrupt();throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,"URL ingestion was interrupted");}catch(Exception e){throw ApiException.badRequest("Paper URL could not be ingested: "+e.getMessage());}
    }


    private Paper store(String title,PaperSourceType type,String url,String fileName,String contentType,byte[] source,List<String> pages){
        String hash=sha256(source);Optional<Paper> existing=papers.findBySha256(hash);if(existing.isPresent())return existing.get();
        String raw=String.join("\f",pages);if(raw.replaceAll("\\s+","").length()<300)throw ApiException.unprocessable("Too little text was extracted; scanned PDFs need OCR before upload");
        Instant now=clock.instant();return papers.save(new Paper(UUID.randomUUID(),title,type,url,fileName,contentType,source,hash,raw,pages.size(),now));
    }
    private Extracted extractPdf(byte[] bytes)throws IOException{
        try(var document=Loader.loadPDF(bytes)){if(document.isEncrypted())throw ApiException.unprocessable("Encrypted PDFs are not supported");PDFTextStripper stripper=new PDFTextStripper();List<String> pages=new ArrayList<>();for(int i=1;i<=document.getNumberOfPages();i++){stripper.setStartPage(i);stripper.setEndPage(i);pages.add(stripper.getText(document).replaceAll("[\\t ]+"," ").trim());}String title=document.getDocumentInformation().getTitle();return new Extracted(title,pages);}
    }
    private URI validatePublicHttps(URI uri)throws UnknownHostException{
        if(!"https".equalsIgnoreCase(uri.getScheme())||uri.getHost()==null||uri.getUserInfo()!=null)throw ApiException.badRequest("Only public HTTPS paper URLs are allowed");
        for(InetAddress address:InetAddress.getAllByName(uri.getHost()))if(isPrivate(address))throw ApiException.badRequest("Private or local network destinations are not allowed");
        return uri;
    }
    private boolean isPrivate(InetAddress address){byte[] raw=address.getAddress();boolean uniqueLocal=raw.length==16&&(raw[0]&0xfe)==0xfc;return uniqueLocal||address.isAnyLocalAddress()||address.isLoopbackAddress()||address.isLinkLocalAddress()||address.isSiteLocalAddress()||address.isMulticastAddress();}
    private boolean startsPdf(byte[] bytes){return bytes.length>=5&&bytes[0]=='%'&&bytes[1]=='P'&&bytes[2]=='D'&&bytes[3]=='F'&&bytes[4]=='-';}
    private String cleanTitle(String supplied,String file,String discovered){String value=supplied==null||supplied.isBlank()?(discovered==null||discovered.isBlank()?file:discovered):supplied;if(value==null||value.isBlank())value="Untitled research paper";value=value.replaceAll("[\\p{Cntrl}]"," ").trim();return value.substring(0,Math.min(500,value.length()));}
    private String safeFilename(String value){if(value==null)return null;String name=value.replace('\\','/');name=name.substring(name.lastIndexOf('/')+1).replaceAll("[\\p{Cntrl}]","_");return name.substring(0,Math.min(500,name.length()));}
    private String sha256(byte[] bytes){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));}catch(Exception e){throw new IllegalStateException(e);}}
    private record Extracted(String title,List<String> pages){}
}
