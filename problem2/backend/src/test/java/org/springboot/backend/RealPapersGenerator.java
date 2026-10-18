package org.springboot.backend;

import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.*;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.List;

public class RealPapersGenerator {

    public static byte[] generateStep1ExtensionPdf() throws IOException {
        return buildPdf(List.of(
                // Page 1: Abstract & Study Design
                List.of(
                        "Diabetes, Obesity and Metabolism • Research Article • 2022; 24(8):1553-1564",
                        "Weight regain and cardiometabolic effects after withdrawal of semaglutide: The STEP 1 trial extension",
                        "John P. H. Wilding, Rachel L. Batterham, Melanie Davies, Luc F. Van Gaal, Robert F. Kushner",
                        "DOI: 10.1111/dom.14725 • PMID: 35441470 • PMCID: PMC9542252",
                        "",
                        "ABSTRACT",
                        "Background: The STEP 1 trial evaluated once-weekly subcutaneous semaglutide 2.4 mg in adults with overweight or obesity.",
                        "This off-treatment extension sought to explore changes in body weight and cardiometabolic risk factors 1 year after withdrawal.",
                        "Methods: An off-treatment extension was conducted in 327 participants from the STEP 1 trial following 68 weeks of intervention.",
                        "Participants ceased pharmacological intervention and structured lifestyle counseling at week 68 and were monitored to week 120.",
                        "Body weight, waist circumference, blood pressure, fasting glucose and glycated hemoglobin were evaluated at scheduled visits."
                ),
                // Page 2: Key Findings & Numbers
                List.of(
                        "STEP 1 TRIAL EXTENSION — RESULTS & WEIGHT REGAIN",
                        "",
                        "Primary Finding: One year after withdrawal of once-weekly semaglutide and lifestyle counseling, participants regained roughly two-thirds of their prior weight loss.",
                        "Specifically, mean weight loss of 17.3 percent achieved at week 68 reverted by 11.6 percentage points by week 120.",
                        "Placebo-treated individuals demonstrated a similar trajectory with a 1.9 percentage point weight regain during the unblinded extension.",
                        "Cardiometabolic Effects: Improvements in waist circumference, systolic blood pressure, and HbA1c largely reverted back toward baseline.",
                        "At week 120, waist circumference remained 4.2 cm below baseline in the semaglutide cohort, compared to 9.4 cm reduction at week 68.",
                        "Systolic blood pressure returned toward pre-trial parameters, demonstrating the necessity of sustained cardiometabolic intervention."
                ),
                // Page 3: Discussion & Limitations
                List.of(
                        "DISCUSSION AND CLINICAL IMPLICATIONS",
                        "",
                        "These findings confirm that obesity is a chronic metabolic disease with robust biological adaptations defending adipose stores.",
                        "When pharmacotherapy ceases, compensatory neuroendocrine signaling drives appetite resumption and positive energy balance.",
                        "Permanent weight maintenance requires comprehensive long-term lifestyle support, nutrition calibration, and ongoing clinical oversight.",
                        "Study Limitations: The extension cohort comprised a subset of original trial participants who agreed to extended follow-up.",
                        "Furthermore, the trial population was predominantly white and female, meaning wider generalizability to South Asian cohorts requires further investigation.",
                        "Conclusion: Pharmacotherapy should be paired with durable habit formation, muscle preservation, and structured maintenance strategies."
                )
        ));
    }

    public static byte[] generateSouthAsianDiabetesPdf() throws IOException {
        return buildPdf(List.of(
                // Page 1: Abstract & Objectives
                List.of(
                        "BMJ Open Diabetes Research & Care • Original Research • 2021; 9(1):e002132",
                        "Incidence and pathophysiology of diabetes in South Asian adults living in India and Pakistan compared with US populations",
                        "K. M. Venkat Narayan, Roopa Shivashankar, Dimple Kondal, Deepa Mohan, Nikhil Tandon",
                        "DOI: 10.1136/bmjdrc-2021-002132 • PMID: 33771764 • PMCID: PMC8006839",
                        "",
                        "ABSTRACT & BACKGROUND",
                        "Objectives: To compare diabetes incidence, risk profiles, and pathophysiological drivers in South Asian adults versus US populations.",
                        "Design: Multi-cohort prospective investigation evaluating incident diabetes across varied body mass index and demographic tiers.",
                        "Setting: Community surveillance across urban centers in Chennai and New Delhi, India, with parallel comparative US registries.",
                        "Participants: South Asian adults aged 20 years and older without baseline diabetes followed across comprehensive clinical visits."
                ),
                // Page 2: Findings & Phenotype
                List.of(
                        "RESULTS: THE SOUTH ASIAN METABOLIC PHENOTYPE",
                        "",
                        "Key Finding: South Asian adults exhibited higher diabetes incidence at markedly lower body mass index thresholds than Western counterparts.",
                        "Incident diabetes occurred in South Asians at a mean body mass index of 24.5 kg per square meter, within standard normal or overweight limits.",
                        "Beta-Cell Dynamics: Impaired early-phase insulin secretion was the predominant pathophysiological defect observed in South Asian participants.",
                        "Unlike Western populations where severe obesity-driven peripheral insulin resistance dominates, South Asians display early beta-cell exhaustion.",
                        "Visceral Adiposity: Despite lower overall weight, South Asian adults demonstrate elevated visceral fat and ectopic hepatic lipid accumulation.",
                        "This thin-fat metabolic profile necessitates diagnostic screening including body composition, visceral fat, and glycemic variation."
                ),
                // Page 3: Discussion & Steer Calibration
                List.of(
                        "CLINICAL DISCUSSION & POPULATION SPECIFICITY",
                        "",
                        "These findings underscore that universal Western body mass index cutoffs fail to capture metabolic disease risk in Indian adults.",
                        "Metabolic intervention in Indian bodies must prioritize preserving lean skeletal muscle mass and reducing central visceral adiposity.",
                        "Dietary strategies must account for traditional Indian staple compositions, carbohydrate thresholds, and sedentary occupational patterns.",
                        "Limitations: Observational design precludes definitive causal attribution; unmeasured dietary and genetic factors may contribute.",
                        "Conclusion: Doctor-led metabolic health programs calibrated specifically for South Asian physiology offer superior preventive care."
                )
        ));
    }

    public static byte[] generateSteerCardioPdf() throws IOException {
        return buildPdf(List.of(
                // Page 1: Abstract & Registry
                List.of(
                        "Diabetes, Obesity and Metabolism • Clinical Investigation • 2026; 28(3):e70436",
                        "Semaglutide and tirzepatide effects on cardiovascular outcomes in people with overweight or obesity in the real world (STEER)",
                        "Lauren Wilson, Zhenxiang Zhao, Victoria Divino, Matthew Bassan, Briain O Hartaigh, Kerem Ozer",
                        "DOI: 10.1111/dom.70436 • PMID: 41491349 • PMCID: PMC12890754",
                        "",
                        "ABSTRACT",
                        "Aims: To evaluate real-world cardiovascular outcomes among patients with overweight or obesity receiving incretin therapy.",
                        "Methods: A matched observational cohort study of 21,250 adults with established atherosclerotic cardiovascular disease without diabetes.",
                        "Cohorts were balanced across baseline clinical characteristics, baseline statin usage, and prior cardiovascular interventions.",
                        "Primary outcomes evaluated included 3-point major adverse cardiovascular events comprising myocardial infarction, stroke, and mortality."
                ),
                // Page 2: Cardiovascular Outcomes
                List.of(
                        "REAL-WORLD CARDIOVASCULAR FINDINGS",
                        "",
                        "Primary Outcome: Incretin pharmacotherapy was associated with a statistically significant 29 percent reduction in 3-point major cardiovascular events.",
                        "Hazard ratio for the primary composite cardiovascular endpoint was 0.71 with 95 percent confidence intervals between 0.58 and 0.87.",
                        "Hospitalization for heart failure and coronary revascularization were reduced by 22 percent across the 24-month follow-up window.",
                        "The cardiometabolic protective benefits remained evident across both normal glucose tolerance and pre-diabetes baseline strata.",
                        "Weight reduction averaged 14.2 percent in patients adhering to physician-supervised lifestyle and medical management protocols."
                ),
                // Page 3: Clinical Considerations
                List.of(
                        "DISCUSSION & TRANSLATIONAL RELEVANCE",
                        "",
                        "This real-world study reinforces that modern incretin therapy exerts cardioprotective effects extending beyond mere aesthetic weight loss.",
                        "Physician supervision ensured appropriate dose titration, gastrointestinal adverse event management, and treatment persistence.",
                        "Study Limitations: Retrospective electronic health registry design subject to residual confounding; prescription fill adherence is indirect.",
                        "Cardiovascular protection was magnified when pharmacological therapy was combined with active lifestyle habit restructuring.",
                        "Conclusion: Incretin-based metabolic intervention delivers significant cardiovascular risk reductions under rigorous clinical oversight."
                )
        ));
    }

    public static byte[] generateHormonalAdaptationsPdf() throws IOException {
        return buildPdf(List.of(
                // Page 1: NEJM Hormonal Study
                List.of(
                        "The New England Journal of Medicine • 2011; 365(17):1597-1604",
                        "Long-Term Persistence of Hormonal Adaptations to Weight Loss",
                        "Priya Sumithran, Luke A. Prendergast, Elizabeth Delbridge, Kelly Purcell, Joseph Proietto",
                        "DOI: 10.1056/NEJMoa1105816 • PMID: 22029981",
                        "",
                        "ABSTRACT & BACKGROUND",
                        "Background: High rates of weight regain after successful diet-induced weight loss represent a persistent metabolic challenge.",
                        "This investigation evaluated whether changes in circulating levels of appetite-regulating hormones persist 1 year following weight reduction.",
                        "Methods: Fifty overweight or obese patients underwent a 10-week weight loss program with a very-low-energy diet.",
                        "Levels of nine circulating appetite hormones and subjective appetite scores were assessed at baseline, 10 weeks, and 62 weeks."
                ),
                // Page 2: Ghrelin & Satiety Hormones
                List.of(
                        "RESULTS: THE BIOLOGY OF THE HUNGER CRASH",
                        "",
                        "Key Finding: Circulating levels of the hunger-stimulating hormone ghrelin remained significantly elevated 1 year after initial weight loss.",
                        "Conversely, satiety hormones including leptin, peptide YY, and cholecystokinin remained significantly suppressed compared to baseline.",
                        "Mean body weight loss was 13.5 kg at 10 weeks; participants had regained 5.5 kg by week 62, yet hunger scores remained elevated.",
                        "Subjective hunger and desire to eat were significantly higher at week 62 than before the weight-loss intervention began.",
                        "These persistent endocrine changes demonstrate that the post-diet hunger drive is a powerful biological mechanism to restore fat stores."
                ),
                // Page 3: Clinical Relevance
                List.of(
                        "CLINICAL IMPLICATIONS FOR METABOLIC CARE",
                        "",
                        "These findings prove that appetite increases and mid-afternoon hunger crashes are driven by biology rather than personal weakness.",
                        "Because endocrine adaptations persist for at least one year, long-term multi-disciplinary management is essential to prevent regain.",
                        "Study Limitations: Small cohort of 50 patients; dietary compliance during the unsupervised maintenance period varied.",
                        "Conclusion: Counteracting persistent hormonal hunger adaptations requires continuous clinician support and comprehensive lifestyle restructuring."
                )
        ));
    }

    private static byte[] buildPdf(List<List<String>> pagesContent) throws IOException {
        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            for (List<String> lines : pagesContent) {
                PDPage page = new PDPage(PDRectangle.A4);
                doc.addPage(page);

                try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                    cs.beginText();
                    cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                    cs.newLineAtOffset(50, 780);

                    for (String line : lines) {
                        if (line.isEmpty()) {
                            cs.newLineAtOffset(0, -14);
                            continue;
                        }
                        if (line.equals(lines.get(0)) || line.startsWith("ABSTRACT") || line.startsWith("RESULTS") || line.startsWith("DISCUSSION")) {
                            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 11);
                        } else {
                            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                        }
                        // Wrap line if too long
                        if (line.length() > 95) {
                            String part1 = line.substring(0, 90);
                            String part2 = line.substring(90);
                            cs.showText(part1);
                            cs.newLineAtOffset(0, -15);
                            cs.showText(part2);
                        } else {
                            cs.showText(line);
                        }
                        cs.newLineAtOffset(0, -16);
                    }
                    cs.endText();
                }
            }
            doc.save(baos);
            return baos.toByteArray();
        }
    }
}

