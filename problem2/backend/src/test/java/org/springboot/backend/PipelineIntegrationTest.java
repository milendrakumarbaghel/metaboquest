package org.springboot.backend;

import tools.jackson.databind.*;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.font.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;
import java.io.ByteArrayOutputStream;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"PIPELINE_API_KEY=pipeline-test-key","REVIEW_API_KEY=review-test-key"})
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker=true)
class PipelineIntegrationTest {
    @Container static final PostgreSQLContainer<?> POSTGRES=new PostgreSQLContainer<>("postgres:16-alpine");
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry){registry.add("spring.datasource.url",POSTGRES::getJdbcUrl);registry.add("spring.datasource.username",POSTGRES::getUsername);registry.add("spring.datasource.password",POSTGRES::getPassword);}
    @Autowired MockMvc mvc; @Autowired ObjectMapper mapper;

    @Test void pdfBecomesTraceableMultiFormatPackageAndRequiresDoctorApproval() throws Exception {
        String paperId=upload("Metabolic trial paper");
        mvc.perform(get("/api/v1/papers/{id}/source",paperId).header("X-API-Key","review-test-key"))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control","private, no-store")).andExpect(content().contentType("application/pdf"));
        JsonNode generated=mapper.readTree(mvc.perform(post("/api/v1/papers/{id}/generate",paperId).header("X-API-Key","pipeline-test-key").contentType(MediaType.APPLICATION_JSON).content("{\"language\":\"en\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("AWAITING_REVIEW"))
                .andExpect(jsonPath("$.aiProvider").value("extractive-local"))
                .andExpect(jsonPath("$.assets.length()").value(4)).andExpect(jsonPath("$.claims[0].evidenceVerified").value(true))
                .andReturn().getResponse().getContentAsString());
        String packageId=generated.get("id").asText();
        mvc.perform(post("/api/v1/review/packages/{id}",packageId).header("X-API-Key","review-test-key").contentType(MediaType.APPLICATION_JSON).content("{\"decision\":\"APPROVED\",\"actor\":\"Dr Reviewer\"}"))
                .andExpect(status().isConflict());
        for(JsonNode claim:generated.get("claims"))mvc.perform(post("/api/v1/review/packages/{packageId}/claims/{claimId}",packageId,claim.get("id").asText()).header("X-API-Key","review-test-key").contentType(MediaType.APPLICATION_JSON).content("{\"approved\":true,\"actor\":\"Dr Reviewer\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.reviewStatus").value("APPROVED"));
        mvc.perform(post("/api/v1/review/packages/{id}",packageId).header("X-API-Key","review-test-key").contentType(MediaType.APPLICATION_JSON).content("{\"decision\":\"APPROVED\",\"actor\":\"Dr Reviewer\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("APPROVED")).andExpect(jsonPath("$.readyForApproval").value(true)).andExpect(jsonPath("$.assets[0].status").value("APPROVED"));
    }

    @Test void apiKeysSeparatePipelineAndDoctorReview() throws Exception {
        mvc.perform(get("/api/v1/papers/"+UUID.randomUUID())).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/review/packages/"+UUID.randomUUID()).header("X-API-Key","pipeline-test-key").contentType(MediaType.APPLICATION_JSON).content("{\"decision\":\"APPROVED\",\"actor\":\"x\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    @Test void rejectsPrivateUrlsAndNonPdfUploads() throws Exception {
        mvc.perform(post("/api/v1/papers/from-url").header("X-API-Key","pipeline-test-key").contentType(MediaType.APPLICATION_JSON).content("{\"url\":\"https://127.0.0.1/paper\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Private")));
        MockMultipartFile text=new MockMultipartFile("file","paper.pdf","application/pdf","not a pdf".getBytes());
        mvc.perform(multipart("/api/v1/papers/upload").file(text).header("X-API-Key","pipeline-test-key")).andExpect(status().isBadRequest());
    }

    @Test void duplicateUploadsAreIdempotentAndBatchRunsAsynchronously() throws Exception {
        byte[] pdf=pdf();String one=upload(pdf,"First title"),two=upload(pdf,"Second title");assertThat(two).isEqualTo(one);
        JsonNode batch=mapper.readTree(mvc.perform(post("/api/v1/batches").header("X-API-Key","pipeline-test-key").contentType(MediaType.APPLICATION_JSON).content("{\"paperIds\":[\""+one+"\"],\"language\":\"en\"}"))
                .andExpect(status().isAccepted()).andReturn().getResponse().getContentAsString());
        String id=batch.get("id").asText();JsonNode current=batch;
        for(int i=0;i<30&&current.get("status").asText().equals("RUNNING");i++){Thread.sleep(100);current=mapper.readTree(mvc.perform(get("/api/v1/batches/{id}",id).header("X-API-Key","pipeline-test-key")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());}
        assertThat(current.get("status").asText()).isEqualTo("COMPLETED");assertThat(current.get("completedCount").asInt()).isEqualTo(1);
    }

    private String upload(String title)throws Exception{return upload(pdf(),title);}
    private String upload(byte[] pdf,String title)throws Exception{MockMultipartFile file=new MockMultipartFile("file","research.pdf","application/pdf",pdf);return mapper.readTree(mvc.perform(multipart("/api/v1/papers/upload").file(file).file(new MockMultipartFile("title","","text/plain",title.getBytes())).header("X-API-Key","pipeline-test-key"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.pageCount").value(1)).andReturn().getResponse().getContentAsString()).get("id").asText();}
    private byte[] pdf()throws Exception{try(PDDocument document=new PDDocument();ByteArrayOutputStream bytes=new ByteArrayOutputStream()){PDPage page=new PDPage();document.addPage(page);try(PDPageContentStream content=new PDPageContentStream(document,page)){content.beginText();content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA),11);content.newLineAtOffset(50,700);for(String line:List.of("A randomized metabolic trial included 120 adults with insulin resistance.","Participants who maintained strength exercise preserved more muscle during weight loss.","The observed result was significant at 12 weeks, but longer follow-up is required.","Researchers measured glucose, body weight, and muscle outcomes at each scheduled visit.","The study population was limited to adults attending one centre, so wider results remain uncertain.","These findings should inform future research rather than individual treatment decisions.")){content.showText(line);content.newLineAtOffset(0,-20);}content.endText();}document.save(bytes);return bytes.toByteArray();}}
}
