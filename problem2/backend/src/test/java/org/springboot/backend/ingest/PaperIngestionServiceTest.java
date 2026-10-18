package org.springboot.backend.ingest;

import org.junit.jupiter.api.Test;

import java.net.URI;

import static org.assertj.core.api.Assertions.assertThat;

class PaperIngestionServiceTest {
    @Test
    void extractsDoiFromBlockedPublisherUrl() {
        assertThat(PaperIngestionService.extractDoi(
                URI.create("https://www.nejm.org/doi/full/10.1056/NEJMoa1105816")))
                .isEqualTo("10.1056/NEJMoa1105816");
    }

    @Test
    void leavesOrdinaryArticleUrlsWithoutDoiUntouched() {
        assertThat(PaperIngestionService.extractDoi(
                URI.create("https://pmc.ncbi.nlm.nih.gov/articles/PMC9542252/")))
                .isNull();
    }
}
